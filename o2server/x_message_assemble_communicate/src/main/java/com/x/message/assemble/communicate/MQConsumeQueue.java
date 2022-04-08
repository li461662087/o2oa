package com.x.message.assemble.communicate;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Properties;
import java.util.concurrent.ExecutionException;

import javax.jms.Connection;
import javax.jms.DeliveryMode;
import javax.jms.Destination;
import javax.jms.JMSException;
import javax.jms.MessageProducer;
import javax.jms.Session;
import javax.jms.TextMessage;
import javax.persistence.EntityManager;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.apache.activemq.ActiveMQConnectionFactory;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.DateUtils;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;

import com.google.gson.Gson;
import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.entity.JpaObject_;
import com.x.base.core.project.config.Config;
import com.x.base.core.project.config.MessageMq;
import com.x.base.core.project.gson.XGsonBuilder;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.base.core.project.message.MessageConnector;
import com.x.base.core.project.queue.AbstractQueue;
import com.x.base.core.project.tools.ListTools;
import com.x.message.core.entity.Message;
import com.x.message.core.entity.Message_;

public class MQConsumeQueue extends AbstractQueue<Message> {

	private static final Logger LOGGER = LoggerFactory.getLogger(MQConsumeQueue.class);

	private static final Gson gson = XGsonBuilder.instance();

	protected void execute(Message message) throws Exception {
		if (null != message && StringUtils.isNotEmpty(message.getItem())) {
			update(message);
		}
		for (String id : listOverStay()) {
			Optional<Message> optional = find(id);
			if (optional.isPresent()) {
				message = optional.get();
				if (StringUtils.isNotEmpty(message.getItem())) {
					update(message);
				}
			}
		}
	}

	private Optional<Message> find(String id) {
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			return Optional.of(emc.find(id, Message.class));
		} catch (Exception e) {
			LOGGER.error(e);
		}
		return Optional.empty();
	}

	private void update(Message message) {
		try {
			MessageMq.Item item = Config.messageMq().get(message.getItem());
			if (null != item) {
				if (StringUtils.equalsIgnoreCase(message.getType(), MessageMq.Item.TYPE_KAFKA)) {
					kafka(message, item);
				} else if (StringUtils.equalsIgnoreCase(message.getType(), MessageMq.Item.TYPE_ACTIVEMQ)) {
					activeMQ(message, item);
				}
				success(message.getId());
			} else {
				throw new ExceptionMessageMqItem(message.getItem());
			}
		} catch (InterruptedException ie) {
			LOGGER.error(ie);
			Thread.currentThread().interrupt();
		} catch (Exception e) {
			failure(message.getId(), e);
			LOGGER.error(e);
		}
	}

	private void kafka(Message message, MessageMq.Item item) throws InterruptedException, ExecutionException {
		Properties properties = new Properties();
		properties.put("bootstrap.servers", item.getKafkaBootstrapServers());
		properties.put("acks", item.getKafkaAcks());
		properties.put("retries", item.getKafkaRetries());
		properties.put("batch.size", item.getKafkaBatchSize());
		properties.put("linger.ms", item.getKafkaLingerMs());
		properties.put("buffer.memory", item.getKafkaBufferMemory());
		properties.put("key.serializer", org.apache.kafka.common.serialization.StringSerializer.class.getName());
		properties.put("value.serializer", org.apache.kafka.common.serialization.StringSerializer.class.getName());
		try (KafkaProducer<String, String> producer = new KafkaProducer<>(properties)) {
			String topic = item.getKafkaTopic();
			String msg = gson.toJson(message);
			producer.send(new ProducerRecord<>(topic, msg)).get();
		}
	}

	private void activeMQ(Message message, MessageMq.Item item) throws JMSException {

		ActiveMQConnectionFactory connectionFactory;

		if (StringUtils.isNotBlank(item.getActiveMQUsername())) {
			connectionFactory = new ActiveMQConnectionFactory(item.getActiveMQUsername(), item.getActiveMQPassword(),
					item.getActiveMQUrl());
		} else {
			connectionFactory = new ActiveMQConnectionFactory(item.getActiveMQUrl());
		}
		connectionFactory.setTrustedPackages(ListTools.toList(MQConsumeQueue.class.getPackage().getName()));
		try (Connection connection = connectionFactory.createConnection()) {
			connection.start();
			try (Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE)) {
				Destination destination = session.createQueue(item.getActiveMQQueueName());
				MessageProducer producer = session.createProducer(destination);
				producer.setDeliveryMode(DeliveryMode.NON_PERSISTENT);
				TextMessage textMessage = session.createTextMessage(gson.toJson(message));
				producer.send(textMessage);
			}
		}
	}

	private void success(String id) {
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			Message message = emc.find(id, Message.class);
			if (null != message) {
				emc.beginTransaction(Message.class);
				message.setConsumed(true);
				emc.commit();
			}
		} catch (Exception e) {
			LOGGER.error(e);
		}
	}

	private void failure(String id, Exception exception) {
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			Message message = emc.find(id, Message.class);
			if (null != message) {
				emc.beginTransaction(Message.class);
				Integer failure = message.getProperties().getFailure();
				failure = (null == failure) ? 1 : failure + 1;
				message.getProperties().setFailure(failure);
				message.getProperties().setError(exception.getMessage());
				emc.commit();
			}
		} catch (Exception e) {
			LOGGER.error(e);
		}
	}

	private List<String> listOverStay() {
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			EntityManager em = emc.get(Message.class);
			CriteriaBuilder cb = em.getCriteriaBuilder();
			CriteriaQuery<String> cq = cb.createQuery(String.class);
			Root<Message> root = cq.from(Message.class);
			Predicate p = cb.equal(root.get(Message_.consumer), MessageConnector.CONSUME_MQ);
			p = cb.and(p, cb.notEqual(root.get(Message_.consumed), true));
			p = cb.and(p, cb.lessThan(root.get(JpaObject_.updateTime), DateUtils.addMinutes(new Date(), -20)));
			cq.select(root.get(Message_.id)).where(p);
			return em.createQuery(cq).setMaxResults(20).getResultList();
		} catch (Exception e) {
			LOGGER.error(e);
		}
		return new ArrayList<>();
	}
}
