package com.x.jpush.assemble.control.jaxrs.message;

import cn.jpush.api.JPushClient;
import cn.jpush.api.push.PushResult;
import cn.jpush.api.push.model.Options;
import cn.jpush.api.push.model.Platform;
import cn.jpush.api.push.model.PushPayload;
import cn.jpush.api.push.model.audience.Audience;
import cn.jpush.api.push.model.notification.AndroidNotification;
import cn.jpush.api.push.model.notification.IosNotification;
import cn.jpush.api.push.model.notification.Notification;
import com.google.gson.JsonElement;
import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.project.annotation.FieldDescribe;
import com.x.base.core.project.bean.NameValuePair;
import com.x.base.core.project.config.Config;
import com.x.base.core.project.config.HuaweiPushConfig;
import com.x.base.core.project.connection.HttpConnection;
import com.x.base.core.project.gson.GsonPropertyObject;
import com.x.base.core.project.gson.XGsonBuilder;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.jaxrs.StandardJaxrsAction;
import com.x.base.core.project.jaxrs.WrapBoolean;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.base.core.project.tools.ListTools;
import com.x.jpush.assemble.control.Business;
import com.x.jpush.assemble.control.huawei.model.Importance;
import com.x.jpush.assemble.control.huawei.model.Urgency;
import com.x.jpush.assemble.control.huawei.model.Visibility;
import com.x.jpush.core.entity.PushDevice;
import javapns.Push;
import javapns.notification.PushNotificationBigPayload;
import javapns.notification.PushedNotification;
import javapns.notification.PushedNotifications;
import org.apache.commons.lang3.StringUtils;

import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;


public class ActionSendMessage  extends StandardJaxrsAction {

    private static Logger logger = LoggerFactory.getLogger( ActionSendMessage.class );


    protected ActionResult<Wo> execute(HttpServletRequest request, EffectivePerson effectivePerson, JsonElement jsonElement) throws Exception {
        logger.info("execute action 'ActionSendMessage'......");
        ActionResult<Wo> result = new ActionResult<>();
        Wo wraps  = new Wo();
        if (jsonElement == null) {
            throw new ExceptionSendMessageEmpty();
        }

        Wi wi = convertToWrapIn(jsonElement, Wi.class);
        if (wi.getPerson() == null || wi.getPerson().equals("") || wi.getMessage() == null ||  wi.getMessage().equals("")) {
            throw new ExceptionSendMessageEmpty();
        }

        try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
            Business business = new Business(emc);
            logger.info("person:"+ wi.getPerson());

            HuaweiPushConfig config = Config.pushConfig().getHuaweiPushConfig();
            if (config !=null && Config.pushConfig().getHuaweiPushEnable()) { // ??????????????????
                logger.info("???????????????????????????????????????????????????");
                List<PushDevice> pushDeviceList = business.sampleEntityClassNameFactory().listHuaweiDevice(wi.getPerson());
                // ?????????????????????Android?????? ios ?????????????????????apns??????
                if (pushDeviceList !=null && !pushDeviceList.isEmpty()) {
                    List<String> androidList = pushDeviceList.stream().filter((p)-> p.getDeviceType().equals(PushDevice.DEVICE_TYPE_ANDROID)).map(PushDevice::getDeviceId).collect(Collectors.toList());
                    if (!androidList.isEmpty()) {
                        send2HuaweiPushOnlyAndroid(androidList, wi.getMessage());
                    }

                    List<String> iosList = pushDeviceList.stream().filter((p)-> p.getDeviceType().equals(PushDevice.DEVICE_TYPE_IOS)).map(PushDevice::getDeviceId).collect(Collectors.toList());
                    if (!iosList.isEmpty()) {
                        send2APNS(iosList, wi.getMessage());
                    }

                }else {
                    logger.info("???????????????????????????"+ wi.getPerson());
                }
            } else {
                logger.info("?????????????????????????????????????????????????????????");
                List<PushDevice> pushDeviceList = business.sampleEntityClassNameFactory().listJpushDevice(wi.getPerson());
                if (pushDeviceList !=null && !pushDeviceList.isEmpty()) {
                    send2Jpush(pushDeviceList, wi.getMessage(), business.sampleEntityClassNameFactory().jpushClient());
                }else {
                    logger.info("???????????????????????????"+ wi.getPerson());
                }
            }

            wraps.setValue(true);
            result.setData(wraps);

//            List<String> deviceList = business.organization().personAttribute()
//                    .listAttributeWithPersonWithName(wi.getPerson(), ActionListAll.DEVICE_PERSON_ATTR_KEY);
//            if(ListTools.isNotEmpty( deviceList ) ){
//                List<String> jiguangDeviceList = new ArrayList<>();
//                for (int i = 0; i < deviceList.size(); i++) {
//                    String deviceId = "";
//                    try {
//                        String[] split = deviceList.get(i).split("_");
//                        deviceId = split[0];
//                        logger.info("device Id:" + deviceId);
//                    }catch (Exception e){
//                        logger.error(e);
//                    }
//                    if (deviceId != null && !deviceId.isEmpty()) {
//                        jiguangDeviceList.add(deviceId);
//                    }
//                }
//                if(ListTools.isNotEmpty( jiguangDeviceList ) ) {
//                    //send
//                    wraps.setValue(true);
//                    result.setData(wraps);
//                }else {
//                    ExceptionSendMessageDeviceEmpty empty = new ExceptionSendMessageDeviceEmpty();
//                    result.error( empty );
//                }
//
//            }else {
//                ExceptionSendMessageDeviceEmpty empty = new ExceptionSendMessageDeviceEmpty();
//                result.error( empty );
//            }
        } catch (Exception e) {
            logger.error(e);
            throw new ExceptionSendMessage( e, "?????????????????????????????????!" );
//            result.error( exception );
        }
        logger.info("action 'ActionSendMessage' execute completed!");
        return result;
    }

    /**
     * ??????????????????
     * @param androidList
     * @param message
     * @throws Exception
     */
    private void send2HuaweiPushOnlyAndroid(List<String> androidList, String message) throws Exception {
        logger.info("????????????????????????????????? "+message);
        if (!androidList.isEmpty()) {
            com.x.jpush.assemble.control.huawei.model.Message m = androidMessage(androidList, message);
            sendHuaweiMessage(m);
        } else {
            logger.info("??????Android ????????????????????????");
        }

    }

    private void sendHuaweiMessage(com.x.jpush.assemble.control.huawei.model.Message msg) throws Exception {
        HashMap<String, Object> sendBody = new HashMap<>();
        sendBody.put("validate_only", false);
        sendBody.put("message", msg);
        List<NameValuePair> heads = new ArrayList<>();
        String url = Config.pushConfig().getHuaweiPushConfig().getPushUrl();
        logger.info("?????????????????????"+url);
        String accessToken = Config.pushConfig().getHuaweiPushConfig().accessToken();
        logger.info("????????????accessToken ???"+accessToken);
        heads.add(new NameValuePair("Authorization", "Bearer " + accessToken));
        String body = XGsonBuilder.instance().toJson(sendBody);
        logger.info("???????????????"+body);
        HuaweiSendResponse result = HttpConnection.postAsObject(url, heads, body, HuaweiSendResponse.class);
        logger.info("???????????????????????????code???" + result.getCode() + ", msg:"+ result.getMsg() + ",  requestId: "+result.getRequestId());
    }

    /**
     * ??????Android??????
     * @param deviceList
     * @param message
     * @return
     */
    private com.x.jpush.assemble.control.huawei.model.Message androidMessage(List<String> deviceList, String message) {
        com.x.jpush.assemble.control.huawei.model.Notification notification
                = com.x.jpush.assemble.control.huawei.model.Notification
                .builder()
                .setTitle(message)
                .setBody(message)
                .build();
        // ??????????????????
        com.x.jpush.assemble.control.huawei.android.BadgeNotification badgeNotification =
                com.x.jpush.assemble.control.huawei.android.BadgeNotification.builder()
                        .setAddNum(1)
                        .setBadgeClass("net.zoneland.x.bpm.mobile.v1.zoneXBPM.app.o2.launch.LaunchActivity")
                        .build();
        com.x.jpush.assemble.control.huawei.android.ClickAction clickAction =
                com.x.jpush.assemble.control.huawei.android.ClickAction.builder()
                        .setType(3)// ????????????
                        .build();
        com.x.jpush.assemble.control.huawei.android.AndroidNotification androidNotification
                = com.x.jpush.assemble.control.huawei.android.AndroidNotification.builder()
                .setTitle(message)
                .setBody(message)
                .setDefaultSound(true)
                .setAutoCancel(false)
                .setBadge(badgeNotification)
                .setClickAction(clickAction)
                .setForegroundShow(true)
                .setVisibility(Visibility.PUBLIC.getValue())
                .setImportance(Importance.NORMAL.getValue())
                .build();

        com.x.jpush.assemble.control.huawei.android.AndroidConfig config = com.x.jpush.assemble.control.huawei.android.AndroidConfig
                .builder()
                .setCollapseKey(-1)
                .setUrgency(Urgency.HIGH.getValue())
                .setNotification(androidNotification)
                .build();

        return com.x.jpush.assemble.control.huawei.model.Message.builder()
                .addAllToken(deviceList)
                .setNotification(notification)
                .setAndroidConfig(config)
                .build();

    }




    /**
     * ??????????????????
     * @param pushDeviceList
     * @param message
     * @param client
     * @throws Exception
     */
    private void send2Jpush(List<PushDevice> pushDeviceList, String message, JPushClient client) throws Exception {
        List<String> jiguangDeviceList = pushDeviceList.stream().map(PushDevice::getDeviceId).collect(Collectors.toList());
        Notification n = Notification.newBuilder()
                .addPlatformNotification(IosNotification.alert(message))
                .addPlatformNotification(AndroidNotification.newBuilder().setPriority(2).setAlert(message).build())
                .build();
        PushPayload pushPayload = PushPayload.newBuilder()
                .setPlatform(Platform.all())
                .setAudience(Audience.registrationId(jiguangDeviceList))
//                .setNotification(Notification.alert(message))
                .setNotification(n)
                .setOptions(Options.newBuilder().setApnsProduction(true).build()).build();
        PushResult pushResult = client.sendPush(pushPayload);
        logger.info("???????????? ????????????:{}.", pushResult);
    }

    /**
     * ??????????????? ????????????????????????
     * @param deviceList
     * @param message
     */
    private void send2APNS(List<String> deviceList, String message) throws Exception {
        logger.info("????????????APNS?????????????????????????????????????????????device: " + ListTools.toStringJoin(deviceList));
        File file = Config.pushConfig().getAPNSKeystoreFilePath();
        if (file == null || !file.exists()) {
            throw new ExceptionSendMessageAPNSFileNotExist();
        }
        String password = Config.pushConfig().getApnsKeystorePassword();
        if (StringUtils.isEmpty(password)) {
            throw new ExceptionSendMessageAPNSPasswordEmpty();
        }
        PushNotificationBigPayload payload = PushNotificationBigPayload.complex();
        payload.addAlert(message);
        payload.addBadge(1);
        List<PushedNotification> notifications = Push.payload(payload, file, password, true, deviceList);
        if (notifications != null) {
            try{
                for (int i = 0; i < notifications.size(); i++) {
                    PushedNotification n = notifications.get(i);
                    if (n.isSuccessful()) {
                        logger.info("????????????"+ n.getDevice().getToken());
                    } else  {
                        logger.info("????????????"+ n.getDevice().getToken());
                        Exception e = n.getException();
                        e.printStackTrace();
                    }
                }
            }catch (Exception e) {
                logger.error(e);
            }
        }else {
            logger.info("??????????????????????????? ???????????????");
        }
        logger.info("???????????? ???????????????");
    }

    public static class HuaweiSendResponse {
        private String code;
        private String msg;
        private String requestId;

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getMsg() {
            return msg;
        }

        public void setMsg(String msg) {
            this.msg = msg;
        }

        public String getRequestId() {
            return requestId;
        }

        public void setRequestId(String requestId) {
            this.requestId = requestId;
        }
    }


    public static class Wi extends GsonPropertyObject {



        @FieldDescribe("??????")
        private String person;

        @FieldDescribe("????????????")
        private String message;

        public String getPerson() {
            return person;
        }

        public void setPerson(String person) {
            this.person = person;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }


    public static class Wo extends WrapBoolean {

    }
}
