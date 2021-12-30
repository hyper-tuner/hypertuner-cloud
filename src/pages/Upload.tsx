import { useState } from 'react';
import {
  Divider,
  Space,
  Typography,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  ToolOutlined,
  FundOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { UploadFile } from 'antd/lib/upload/interface';

enum MaxFiles {
  TUNE_FILES = 1,
  LOG_FILES = 5,
  TOOTH_LOG_FILES = 5,
}

const uploadButton = <Space direction="vertical"><PlusOutlined />Upload</Space>;
const tuneIcon = () => <ToolOutlined />;
const logIcon = () => <FundOutlined />;
const toothLogIcon = () => <SettingOutlined />;

const UploadPage = () => {
  const [tuneFiles, setTuneFiles] = useState<UploadFile[]>([]);
  const [logFiles, setLogFiles] = useState<UploadFile[]>([]);
  const [toothLogFiles, setToothLogFiles] = useState<UploadFile[]>([]);

  const onTuneFilesChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setTuneFiles(newFileList);
  };

  const onLogFilesChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setLogFiles(newFileList);
  };

  const onToothLogFilesChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setToothLogFiles(newFileList);
  };

  return (
    <div style={{
      padding: 20,
      maxWidth: 600,
      margin: '0 auto',
    }}>
      <Divider>
        <Space>
          Upload Tune
          <Typography.Text type="secondary">(.msq)</Typography.Text>
        </Space>
      </Divider>
      <Upload
        listType="picture-card"
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
    </div>
  );
};

export default UploadPage;
