import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  Button,
  Divider,
  Input,
  notification,
  Skeleton,
  Space,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  ToolOutlined,
  FundOutlined,
  SettingOutlined,
  CopyOutlined,
  ShareAltOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { UploadRequestOption } from 'rc-upload/lib/interface';
import { useHistory } from 'react-router-dom';
import { UploadFile } from 'antd/lib/upload/interface';
import pako from 'pako';
import {
  customAlphabet,
  nanoid,
} from 'nanoid';
import {
  emailNotVerified,
  restrictedPage,
} from './auth/notifications';
import { useAuth } from '../contexts/AuthContext';
import { Routes } from '../routes';
import {
  fireStoreDoc,
  setDoc,
  addDoc,
  getDoc,
  getStorage,
  storageRef,
  uploadBytesResumable,
  db,
  fireStoreCollection,
} from '../firebase';
import useStorage from '../hooks/useStorage';

enum MaxFiles {
  TUNE_FILES = 1,
  LOG_FILES = 5,
  TOOTH_LOG_FILES = 5,
}

const containerStyle = {
  padding: 20,
  maxWidth: 600,
  margin: '0 auto',
};

const NEW_TUNE_ID_KEY = 'newTuneId';

const tuneIcon = () => <ToolOutlined />;
const logIcon = () => <FundOutlined />;
const toothLogIcon = () => <SettingOutlined />;

const storage = getStorage();
const nanoidCustom = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);

const UploadPage = () => {
  const [isUserAuthorized, setIsUserAuthorized] = useState(false);
  const hasNavigatorShare = navigator.share !== undefined;
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { currentUser, refreshToken } = useAuth();
  const history = useHistory();
  const { storageSet, storageGet, storageDelete } = useStorage();
  const [tuneFiles, setTuneFiles] = useState<UploadFile[]>([]);
  const [logFiles, setLogFiles] = useState<UploadFile[]>([]);
  const [toothLogFiles, setToothLogFiles] = useState<UploadFile[]>([]);

  const copyToClipboard = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  const onTuneFilesChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setTuneFiles(newFileList);
  };

  const onLogFilesChange = ({ file, fileList: newFileList }: { file: any, fileList: UploadFile[] }) => {
    setLogFiles(newFileList);
  };

  const onToothLogFilesChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setToothLogFiles(newFileList);
  };

  const uploadTune = async ({ onError, onSuccess, onProgress, file }: UploadRequestOption) => {
    try {
      const buffer = await (file as File).arrayBuffer();
      const name = nanoid();
      const newTuneId = await storageGet(NEW_TUNE_ID_KEY);
      const path = `public/users/${currentUser!.uid}/tunes/${newTuneId}/${name}.msq.gz`;
      const ref = storageRef(storage, path);
      const compressed = pako.deflate(new Uint8Array(buffer));
      const uploadTask = uploadBytesResumable(ref, compressed, {
        customMetadata: {
          name: (file as File).name,
          size: `${(file as File).size}`,
        },
      });

      uploadTask.on(
        'state_changed',
        (snap) => onProgress!({ percent: (snap.bytesTransferred / snap.totalBytes) * 100 }),
        (err) => onError!(err),
        async () => {
          await setDoc(fireStoreDoc(db, 'tunes', newTuneId!), {
            tuneFiles: [path],
          }, {
            merge: true,
          });

          onSuccess!(file);
        },
      );
    } catch (error) {
      console.error('Upload error:', error);
      notification.error({
        message: 'Upload error',
        description: (error as Error).message,
      });
      onError!(error as Error);
    }

    return true;
  };

  // TODO: validate size
  // TODO: make sure yuo can't override someone elses files (make a directory for each user)

  const prepareData = useCallback(async () => {
    let newTuneId = await storageGet(NEW_TUNE_ID_KEY);
    if (!newTuneId) {
      newTuneId = nanoidCustom();
      await storageSet(NEW_TUNE_ID_KEY, newTuneId);
    }

    if (!currentUser) {
      restrictedPage();
      history.push(Routes.LOGIN);

      return;
    }

    try {
      await refreshToken();

      if (!currentUser.emailVerified) {
        emailNotVerified();
        history.push(Routes.LOGIN);

        return;
      }

      const found = await getDoc(fireStoreDoc(db, 'tunes', newTuneId));
      if (!found.exists()) {
        await setDoc(fireStoreDoc(db, 'tunes', newTuneId), {
          userUid: currentUser.uid,
          createdAt: new Date(),
          isPublic: true,
          isListed: true,
        });
      }
      setShareUrl(`https://speedytuner.cloud/#/t/${newTuneId}`);
      setIsUserAuthorized(true);
    } catch (error) {
      storageDelete(NEW_TUNE_ID_KEY);
      console.error(error);
      notification.error({
        message: 'Error',
        description: (error as Error).message,
      });
    }

  }, [currentUser, history, refreshToken, storageDelete, storageGet, storageSet]);

  useEffect(() => {
    prepareData();
  }, [currentUser, history, prepareData, refreshToken]);

  const uploadButton = (
    <Space direction="vertical">
      <PlusOutlined />Upload
    </Space>
  );

  const shareSection = (
    <>
      <Divider>Share</Divider>
      <Input
        style={{ width: `calc(100% - ${hasNavigatorShare ? 100 : 65}px)` }}
        value={shareUrl!}
      />
      <Tooltip title={copied ? 'Copied' : 'Copy URL'}>
        <Button icon={<CopyOutlined />} onClick={copyToClipboard} />
      </Tooltip>
      {hasNavigatorShare && (
        <Tooltip title="Share">
          <Button
            icon={<ShareAltOutlined />}
            onClick={() => navigator.share({ url: shareUrl! })}
          />
        </Tooltip>
      )}
      <a
        href={shareUrl!}
        target="__blank"
        rel="noopener noreferrer"
      >
        <Tooltip title="Open in new tab">
          <Button icon={<SendOutlined />} />
        </Tooltip>
      </a>
    </>
  );

  if (!isUserAuthorized) {
    return (
      <div style={containerStyle}>
        <Skeleton active />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Divider>
        <Space>
          Upload Tune
          <Typography.Text type="secondary">(.msq)</Typography.Text>
        </Space>
      </Divider>
      <Upload
        listType="picture-card"
        customRequest={uploadTune}
        iconRender={tuneIcon}
        fileList={tuneFiles}
        onChange={onTuneFilesChange}
        accept=".msq"
      >
        {tuneFiles.length < MaxFiles.TUNE_FILES && uploadButton}
      </Upload>
      <Divider>
        <Space>
          Upload Logs
          <Typography.Text type="secondary">(.mlg, .csv, .msl)</Typography.Text>
        </Space>
      </Divider>
      <Upload
        listType="picture-card"
        iconRender={logIcon}
        fileList={logFiles}
        onChange={onLogFilesChange}
        multiple
        maxCount={MaxFiles.LOG_FILES}
        accept=".mlg,.csv,.msl"
      >
        {logFiles.length < MaxFiles.LOG_FILES && uploadButton}
      </Upload>
      <Divider>
        <Space>
          Upload Tooth and Composite logs
          <Typography.Text type="secondary">(.csv)</Typography.Text>
        </Space>
      </Divider>
      <Upload
        listType="picture-card"
        iconRender={toothLogIcon}
        fileList={toothLogFiles}
        onChange={onToothLogFilesChange}
        multiple
        maxCount={MaxFiles.TOOTH_LOG_FILES}
        accept=".csv"
      >
        {toothLogFiles.length < MaxFiles.TOOTH_LOG_FILES && uploadButton}
      </Upload>
      {shareUrl && shareSection}
    </div>
  );
};

export default UploadPage;
