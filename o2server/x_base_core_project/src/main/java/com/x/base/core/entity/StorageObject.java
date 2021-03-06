package com.x.base.core.entity;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.Date;
import java.util.Objects;

import javax.persistence.MappedSuperclass;
import javax.persistence.Transient;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.vfs2.CacheStrategy;
import org.apache.commons.vfs2.FileObject;
import org.apache.commons.vfs2.FileSystemException;
import org.apache.commons.vfs2.FileSystemManager;
import org.apache.commons.vfs2.FileSystemOptions;
import org.apache.commons.vfs2.cache.NullFilesCache;
import org.apache.commons.vfs2.impl.StandardFileSystemManager;
import org.apache.commons.vfs2.provider.ftp.FtpFileSystemConfigBuilder;
import org.apache.commons.vfs2.provider.ftp.FtpFileType;
import org.apache.commons.vfs2.provider.ftps.FtpsFileSystemConfigBuilder;
import org.apache.commons.vfs2.provider.webdav4.Webdav4FileSystemConfigBuilder;

import com.x.base.core.project.config.Config;
import com.x.base.core.project.config.StorageMapping;
import com.x.base.core.project.tools.DefaultCharset;

@MappedSuperclass
public abstract class StorageObject extends SliceJpaObject {

	private static FileSystemManager fileSystemManagerInstance;

	private synchronized FileSystemManager getFileSystemManager() throws FileSystemException {
		if (fileSystemManagerInstance == null) {
			StandardFileSystemManager fs = new StandardFileSystemManager();
			fs.setFilesCache(new NullFilesCache());
			fs.setCacheStrategy(CacheStrategy.ON_RESOLVE);
			fs.init();
			fileSystemManagerInstance = fs;

		}
		return fileSystemManagerInstance;
	}

	private static final long serialVersionUID = 7823729771901802653L;

	public static final String PATHSEPARATOR = "/";

	public static final String DELETE_OPERATE = "delete";

	public abstract String path() throws Exception;

	public abstract String getStorage();

	public abstract void setStorage(String storage);

	public abstract Long getLength();

	public abstract void setLength(Long length);

	public abstract String getName();

	public abstract void setName(String name);

	public abstract String getExtension();

	public abstract void setExtension(String extension);

	public abstract Date getLastUpdateTime();

	public abstract void setLastUpdateTime(Date lastUpdateTime);

	public abstract Boolean getDeepPath();

	public abstract void setDeepPath(Boolean deepPath);

	public String path(String operate) throws Exception {
		return this.path();
	}

	@Transient
	private byte[] bytes;

	public byte[] getBytes() {
		return bytes;
	}

	public void setBytes(byte[] bytes) {
		this.bytes = bytes;
	}

	/** ??????????????????bytes????????????????????????????????? */
	public Long dumpContent(StorageMapping mapping) throws Exception {
		long length = -1L;
		try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
			length = this.readContent(mapping, output);
			if (length < 0) {
				this.setBytes(new byte[] {});
			} else {
				this.setBytes(output.toByteArray());
			}
		}
		return length;
	}

	/** ?????????????????????????????? */
	public Long saveContent(StorageMapping mapping, byte[] bytes, String name) throws Exception {
		this.setName(name);
		this.setDeepPath(mapping.getDeepPath());
		this.setExtension(StringUtils.lowerCase(StringUtils.substringAfterLast(name, ".")));
		return this.updateContent(mapping, bytes);
	}

	/** ??????????????????????????? */
	public Long saveContent(StorageMapping mapping, InputStream input, String name) throws Exception {
		this.setName(name);
		this.setDeepPath(mapping.getDeepPath());
		this.setExtension(StringUtils.lowerCase(StringUtils.substringAfterLast(name, ".")));
		return this.updateContent(mapping, input);
	}

	/** ??????Content?????? */
	public Long updateContent(StorageMapping mapping, byte[] bytes, String name) throws Exception {
		try (ByteArrayInputStream bais = new ByteArrayInputStream(bytes)) {
			if (StringUtils.isNotEmpty(name)) {
				this.setName(name);
				this.setExtension(StringUtils.lowerCase(FilenameUtils.getExtension(name)));
			}
			return updateContent(mapping, bais);
		}
	}

	/** ??????Content?????? */
	public Long updateContent(StorageMapping mapping, InputStream input, String name) throws Exception {
		if (StringUtils.isNotEmpty(name)) {
			this.setName(name);
			this.setExtension(StringUtils.lowerCase(FilenameUtils.getExtension(name)));
		}
		return updateContent(mapping, input);
	}

	/** ??????Content?????? */
	public Long updateContent(StorageMapping mapping, InputStream input) throws Exception {
		if (Objects.equals(StorageProtocol.hdfs, mapping.getProtocol())) {
			return this.hdfsUpdateContent(mapping, IOUtils.toByteArray(input));
		} else {
			return this.vfsUpdateContent(mapping, input);
		}
	}

	/** ??????Content?????? */
	public Long updateContent(StorageMapping mapping, byte[] bytes) throws Exception {
		if (Objects.equals(StorageProtocol.hdfs, mapping.getProtocol())) {
			return this.hdfsUpdateContent(mapping, bytes);
		} else {
			return this.vfsUpdateContent(mapping, new ByteArrayInputStream(bytes));
		}
	}

	/**
	 * ????????????
	 * @param mapping
	 * @return
	 * @throws Exception
	 */
	public byte[] readContent(StorageMapping mapping) throws Exception {
		try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
			readContent(mapping, baos);
			return baos.toByteArray();
		}
	}

	/**
	 * ??????????????????output
	 * @param mapping
	 * @param output
	 * @return
	 * @throws Exception
	 */
	public Long readContent(StorageMapping mapping, OutputStream output) throws Exception {
		if (Objects.equals(mapping.getProtocol(), StorageProtocol.hdfs)) {
			return hdfsReadContent(mapping, output);
		} else {
			return vfsReadContent(mapping, output);
		}
	}

	/**
	 * ????????????????????????
	 * @param mapping
	 * @return
	 * @throws Exception
	 */
	public boolean existContent(StorageMapping mapping) throws Exception {
		if (Objects.equals(mapping.getProtocol(), StorageProtocol.hdfs)) {
			return hdfsExistContent(mapping);
		} else {
			return vfsExistContent(mapping);
		}
	}

	public void deleteContent(StorageMapping mapping) throws Exception {
		if (Objects.equals(mapping.getProtocol(), StorageProtocol.hdfs)) {
			hdfsDeleteContent(mapping);
		} else {
			vfsDeleteContent(mapping);
		}
	}

	/**
	 * ???????????????????????????????????????
	 * @param mapping
	 * @return
	 * @throws IllegalStateException
	 * @throws UnsupportedEncodingException
	 */
	private String getPrefix(StorageMapping mapping) throws IllegalStateException, UnsupportedEncodingException {
		String prefix = "";
		if (null == mapping.getProtocol()) {
			throw new IllegalStateException("storage protocol is null.");
		}
		switch (mapping.getProtocol()) {
		case ftp:
			prefix = "ftp://" + URLEncoder.encode(mapping.getUsername(), DefaultCharset.name) + ":"
					+ URLEncoder.encode(mapping.getPassword(), DefaultCharset.name) + "@" + mapping.getHost() + ":"
					+ mapping.getPort();
			break;
		case ftps:
			prefix = "ftps://" + URLEncoder.encode(mapping.getUsername(), DefaultCharset.name) + ":"
					+ URLEncoder.encode(mapping.getPassword(), DefaultCharset.name) + "@" + mapping.getHost() + ":"
					+ mapping.getPort();
			break;
		case sftp:
			prefix = "sftp://" + URLEncoder.encode(mapping.getUsername(), DefaultCharset.name) + ":"
					+ URLEncoder.encode(mapping.getPassword(), DefaultCharset.name) + "@" + mapping.getHost() + ":"
					+ mapping.getPort();
			break;
		case cifs:
			prefix = "smb://" + URLEncoder.encode(mapping.getUsername(), DefaultCharset.name) + ":"
					+ URLEncoder.encode(mapping.getPassword(), DefaultCharset.name) + "@" + mapping.getHost() + ":"
					+ mapping.getPort();
			break;
		case webdav:
			prefix = "webdav4://" + URLEncoder.encode(mapping.getUsername(), DefaultCharset.name) + ":"
					+ URLEncoder.encode(mapping.getPassword(), DefaultCharset.name) + "@" + mapping.getHost() + ":"
					+ mapping.getPort();
			break;
		case file:
			prefix = "file://";
			break;
		case hdfs:
			// ??????????????????????????????homeDirctory,????????????
			return StringUtils.isEmpty(mapping.getPrefix()) ? "/" : ("/" + mapping.getPrefix());
		default:
			break;
		}
		return prefix + (StringUtils.isEmpty(mapping.getPrefix()) ? "" : ("/" + mapping.getPrefix()));
	}

	private FileSystemOptions getOptions(StorageMapping mapping) throws Exception {
		FileSystemOptions opts = new FileSystemOptions();
		if (null == mapping.getProtocol()) {
			throw new IllegalStateException("storage protocol is null.");
		}
		switch (mapping.getProtocol()) {
		case sftp:
			FtpFileSystemConfigBuilder sftpBuilder = FtpFileSystemConfigBuilder.getInstance();
			sftpBuilder.setPassiveMode(opts, Config.vfs().getSftp().getPassive());
			// ???????????????IP
			sftpBuilder.setRemoteVerification(opts, false);
			sftpBuilder.setFileType(opts, FtpFileType.BINARY);
			sftpBuilder.setConnectTimeout(opts, 10 * 1000);
			sftpBuilder.setSoTimeout(opts, 10 * 1000);
			sftpBuilder.setControlEncoding(opts, DefaultCharset.name);
			// By default, the path is relative to the user's home directory. This can be
			// changed with:
			sftpBuilder.setUserDirIsRoot(opts, false);
			break;
		case ftp:
			FtpFileSystemConfigBuilder ftpBuilder = FtpFileSystemConfigBuilder.getInstance();
			/*
			 * ????????????????????????????????????centos7????????????????????????????????? Caused by: java.net.ConnectException:
			 * Connection timed out (Connection timed out) at
			 * java.net.PlainSocketImpl.socketConnect(Native Method) at
			 * java.net.AbstractPlainSocketImpl.doConnect(AbstractPlainSocketImpl.java:350)
			 * at java.net.AbstractPlainSocketImpl.connectToAddress(AbstractPlainSocketImpl.
			 * java:206) at
			 * java.net.AbstractPlainSocketImpl.connect(AbstractPlainSocketImpl.java:188) at
			 * java.net.SocksSocketImpl.connect(SocksSocketImpl.java:392) at
			 * java.net.Socket.connect(Socket.java:589)
			 */
			ftpBuilder.setPassiveMode(opts, Config.vfs().getFtp().getPassive());
			// ???????????????IP
			ftpBuilder.setRemoteVerification(opts, false);
			// FtpFileType.BINARY is the default
			ftpBuilder.setFileType(opts, FtpFileType.BINARY);
			ftpBuilder.setConnectTimeout(opts, 10 * 1000);
			ftpBuilder.setSoTimeout(opts, 10 * 1000);
			ftpBuilder.setControlEncoding(opts, DefaultCharset.name);
			break;
		case ftps:
			FtpsFileSystemConfigBuilder ftpsBuilder = FtpsFileSystemConfigBuilder.getInstance();
			ftpsBuilder.setPassiveMode(opts, Config.vfs().getFtp().getPassive());
			// ???????????????IP
			ftpsBuilder.setRemoteVerification(opts, false);
			// FtpFileType.BINARY is the default
			ftpsBuilder.setFileType(opts, FtpFileType.BINARY);
			ftpsBuilder.setConnectTimeout(opts, 10 * 1000);
			ftpsBuilder.setSoTimeout(opts, 10 * 1000);
			ftpsBuilder.setControlEncoding(opts, DefaultCharset.name);
			break;
		case cifs:
			break;
		case webdav:
			Webdav4FileSystemConfigBuilder webdavBuilder = Webdav4FileSystemConfigBuilder.getInstance();
			webdavBuilder.setConnectionTimeout(opts, 10 * 1000);
			webdavBuilder.setSoTimeout(opts, 10 * 1000);
			webdavBuilder.setUrlCharset(opts, DefaultCharset.name);
			webdavBuilder.setMaxConnectionsPerHost(opts, 200);
			webdavBuilder.setMaxTotalConnections(opts, 200);
			webdavBuilder.setFollowRedirect(opts, true);
			break;
		case file:
			break;
		default:
			break;
		}
		return opts;
	}

	private Long vfsUpdateContent(StorageMapping mapping, InputStream inputStream) throws Exception {
		String prefix = this.getPrefix(mapping);
		String path = this.path();
		if (StringUtils.isEmpty(path)) {
			throw new IllegalStateException("path can not be empty.");
		}
		FileSystemOptions options = this.getOptions(mapping);
		long length = -1L;
		FileSystemManager manager = this.getFileSystemManager();
		/*
		 * ??????????????????????????????????????????nginx????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
		 * org.apache.commons.vfs2.FileSystemException: Could not create folder
		 * "ftp://processPlatform:***@o2.server01.com:20040/20200601/1beb018a-5009-4baa-a9ef-7e903f9d48ef".
		 * ???????????????????????????????????????????????????????????????????????????.
		 */
		for (int i = 0; i < 2; i++) {
			try (FileObject fo = manager.resolveFile(prefix + PATHSEPARATOR + path, options);
					OutputStream output = fo.getContent().getOutputStream()) {
				length = IOUtils.copyLarge(inputStream, output);
				this.setLength(length);
				if ((!Objects.equals(StorageProtocol.webdav, mapping.getProtocol()))
						&& (!Objects.equals(StorageProtocol.sftp, mapping.getProtocol()))) {
					/* webdav????????????????????????commons.httpClient */
					manager.closeFileSystem(fo.getFileSystem());
				}
				this.setStorage(mapping.getName());
				this.setLastUpdateTime(new Date());
				break;
			} catch (FileSystemException fse) {
				if (i != 0) {
					// ????????????????????????,?????????????????????.?????????????????????????????????.
					throw fse;
				}
			}
		}
		return length;
	}

	/**
	 * vfs????????????
	 * @param mapping
	 * @param output
	 * @return
	 * @throws Exception
	 */
	private Long vfsReadContent(StorageMapping mapping, OutputStream output) throws Exception {
		long length = -1L;
		FileSystemManager manager = this.getFileSystemManager();
		String prefix = this.getPrefix(mapping);
		String path = this.path();
		FileSystemOptions options = this.getOptions(mapping);
		try (FileObject fo = manager.resolveFile(prefix + PATHSEPARATOR + path, options)) {
			if (fo.exists() && fo.isFile()) {
				try (InputStream input = fo.getContent().getInputStream()) {
					length = IOUtils.copyLarge(input, output);
				}
			} else {
				throw new FileNotFoundException(
						fo.getPublicURIString() + " not existed, object:" + this.toString() + ".");
			}
			if (!Objects.equals(StorageProtocol.webdav, mapping.getProtocol())) {
				/* webdav????????????????????????commons.httpClient */
				manager.closeFileSystem(fo.getFileSystem());
			}
		}
		return length;
	}

	private boolean vfsExistContent(StorageMapping mapping) throws Exception {
		FileSystemManager manager = this.getFileSystemManager();
		String prefix = this.getPrefix(mapping);
		String path = this.path();
		FileSystemOptions options = this.getOptions(mapping);
		try (FileObject fo = manager.resolveFile(prefix + PATHSEPARATOR + path, options)) {
			return (fo.exists() && fo.isFile());
		}
	}

	/**
	 * ????????????,???????????????????????????(???????????????)????????????,??????????????????????????????
	 * @param mapping
	 * @throws Exception
	 */
	private void vfsDeleteContent(StorageMapping mapping) throws Exception {
		FileSystemManager manager = this.getFileSystemManager();
		String prefix = this.getPrefix(mapping);
		String path = this.path(DELETE_OPERATE);
		FileSystemOptions options = this.getOptions(mapping);
		try (FileObject fo = manager.resolveFile(prefix + PATHSEPARATOR + path, options)) {
			if (fo.exists() && fo.isFile()) {
				fo.delete();
				if ((!StringUtils.startsWith(path, PATHSEPARATOR)) && (StringUtils.contains(path, PATHSEPARATOR))) {
					FileObject parent = fo.getParent();
					if ((null != parent) && parent.exists() && parent.isFolder()
							&& (parent.getChildren().length == 0)) {
						parent.delete();
					}
				}
			}
			if (!Objects.equals(StorageProtocol.webdav, mapping.getProtocol())) {
				// webdav????????????????????????commons.httpClient
				manager.closeFileSystem(fo.getFileSystem());
			}
		}
	}

	private long hdfsUpdateContent(StorageMapping mapping, byte[] bytes) throws Exception {
		try (org.apache.hadoop.fs.FileSystem fileSystem = org.apache.hadoop.fs.FileSystem
				.get(hdfsConfiguration(mapping))) {
			org.apache.hadoop.fs.Path path = new org.apache.hadoop.fs.Path(getPrefix(mapping), this.path());
			if (fileSystem.exists(path)) {
				fileSystem.delete(path, false);
			}
			try (org.apache.hadoop.fs.FSDataOutputStream out = fileSystem.create(path)) {
				out.write(bytes);
				this.setStorage(mapping.getName());
				this.setLastUpdateTime(new Date());
				this.setLength((long) bytes.length);
			}
		}
		return bytes.length;
	}

	private Long hdfsReadContent(StorageMapping mapping, OutputStream output) throws Exception {
		long length = -1L;
		try (org.apache.hadoop.fs.FileSystem fileSystem = org.apache.hadoop.fs.FileSystem
				.get(hdfsConfiguration(mapping))) {
			org.apache.hadoop.fs.Path path = new org.apache.hadoop.fs.Path(getPrefix(mapping), this.path());
			if (fileSystem.exists(path)) {
				try (org.apache.hadoop.fs.FSDataInputStream inputStream = fileSystem.open(path)) {
					length = IOUtils.copyLarge(inputStream, output);
				}
			} else {
				throw new FileNotFoundException(path + " not existed, object:" + this.toString() + ".");
			}
		}
		return length;
	}

	private boolean hdfsExistContent(StorageMapping mapping) throws Exception {
		try (org.apache.hadoop.fs.FileSystem fileSystem = org.apache.hadoop.fs.FileSystem
				.get(hdfsConfiguration(mapping))) {
			org.apache.hadoop.fs.Path path = new org.apache.hadoop.fs.Path(getPrefix(mapping), this.path());
			return fileSystem.exists(path);
		}
	}

	private void hdfsDeleteContent(StorageMapping mapping) throws Exception {
		try (org.apache.hadoop.fs.FileSystem fileSystem = org.apache.hadoop.fs.FileSystem
				.get(hdfsConfiguration(mapping))) {
			org.apache.hadoop.fs.Path path = new org.apache.hadoop.fs.Path(getPrefix(mapping), this.path());
			if (fileSystem.exists(path)) {
				fileSystem.delete(path, false);
			}
		}
	}

	private org.apache.hadoop.conf.Configuration hdfsConfiguration(StorageMapping mapping) {
		if ((!StringUtils.equals(System.getProperty("HADOOP_USER_NAME"), mapping.getUsername()))
				&& StringUtils.isNotBlank(mapping.getUsername())) {
			System.setProperty("HADOOP_USER_NAME", mapping.getUsername());
		}
		org.apache.hadoop.conf.Configuration configuration = new org.apache.hadoop.conf.Configuration();
		configuration.set("fs.default.name",
				StorageProtocol.hdfs + "://" + mapping.getHost() + ":" + mapping.getPort());
		configuration.set("fs.hdfs.impl", "org.apache.hadoop.hdfs.DistributedFileSystem");
		return configuration;
	}

}
