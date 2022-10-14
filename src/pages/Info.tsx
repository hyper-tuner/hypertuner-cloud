import {
  useEffect,
  useState,
} from 'react';
import { connect } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Select,
} from 'antd';
import { EditOutlined } from '@ant-design/icons';
import {
  generatePath,
  useNavigate,
} from 'react-router-dom';
import {
  AppState,
  TuneDataState,
} from '../types/state';
import Loader from '../components/Loader';
import { Routes } from '../routes';
import { useAuth } from '../contexts/AuthContext';
import useDb from '../hooks/useDb';

const { Item } = Form;
const rowProps = { gutter: 10 };
const colProps = { span: 24, sm: 12 };

const mapStateToProps = (state: AppState) => ({
  tuneData: state.tuneData,
});

interface GetUserResponse {
  id: string;
  name: string;
  tunes: [];
}

const Info = ({ tuneData }: { tuneData: TuneDataState }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { getUser } = useDb();
  const [author, setAuthor] = useState<string>();

  const goToEdit = () => navigate(generatePath(Routes.UPLOAD_WITH_TUNE_ID, {
    tuneId: tuneData.tuneId,
  }));

  const loadData = async () => {
    const authorData: GetUserResponse = JSON.parse((await getUser(tuneData.userId)).response);
    setAuthor(authorData.name);
  };

  useEffect(() => {
    if (tuneData?.userId) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuneData]);

  const canManage = tuneData?.userId === currentUser?.$id;

  const manageSection = (
    <>
      <Divider>Manage</Divider>
      <Row style={{ marginTop: 10 }}>
        <Item style={{ width: '100%' }}>
          <Button
            type="primary"
            block
            onClick={goToEdit}
            icon={<EditOutlined />}
          >
            Edit
          </Button>
        </Item>
      </Row>
    </>
  );

  if (!tuneData?.vehicleName) {
    return <Loader />;
  }

  return (
    <div className="small-container">
      <Divider>Details</Divider>
      <Form>
        <Row {...rowProps}>
          <Col span={24} sm={24}>
            <Item>
              <Input value={author || 'loading...'} addonBefore="Author" />
            </Item>
          </Col>
        </Row>
        <Row {...rowProps}>
          <Col span={24} sm={24}>
            <Item>
              <Input value={tuneData.vehicleName!} addonBefore="Vehicle name" />
            </Item>
          </Col>
        </Row>
        <Row {...rowProps}>
          <Col {...colProps}>
            <Item>
              <Input value={tuneData.engineMake!} addonBefore="Engine make" />
            </Item>
          </Col>
          <Col {...colProps}>
            <Item>
              <Input value={tuneData.engineCode!} addonBefore="Engine code" />
            </Item>
          </Col>
        </Row>
        <Row {...rowProps}>
          <Col {...colProps}>
            <Item>
              <Input value={tuneData.displacement!} addonBefore="Displacement" addonAfter="l" />
            </Item>
          </Col>
          <Col {...colProps}>
            <Item>
              <Input value={tuneData.cylindersCount!} addonBefore="Cylinders" style={{ width: '100%' }} />
            </Item>
          </Col>
        </Row>
        <Row {...rowProps}>
          <Col {...colProps}>
            <Item>
              <Select placeholder="Aspiration" style={{ width: '100%' }} value={tuneData.aspiration}>
                <Select.Option value="na">Naturally aspirated</Select.Option>
                <Select.Option value="turbocharged">Turbocharged</Select.Option>
                <Select.Option value="supercharged">Supercharged</Select.Option>
              </Select>
            </Item>
          </Col>
          <Col {...colProps}>
            <Item>
              <Input value={tuneData.compression!} addonBefore="Compression" style={{ width: '100%' }} addonAfter=":1" />
            </Item>
          </Col>
        </Row>
        <Row {...rowProps}>
          <Col {...colProps}>
            <Item>
              <Input value={tuneData.fuel!} addonBefore="Fuel" />
            </Item>
          </Col>
          <Col {...colProps}>
            <Item>
              <Input value={tuneData.ignition!} addonBefore="Ignition" />
            </Item>
          </Col>
        </Row>
        <Row {...rowProps}>
          <Col {...colProps}>
            <Item>
              <Input value={tuneData.injectorsSize!} addonBefore="Injectors size" addonAfter="cc" />
            </Item>
          </Col>
          <Col {...colProps}>
            <Item>
              <Input value={tuneData.year!} addonBefore="Year" />
            </Item>
          </Col>
        </Row>
        <Row {...rowProps}>
          <Col {...colProps}>
            <Item>
              <Input value={tuneData.hp!} addonBefore="HP" style={{ width: '100%' }} />
            </Item>
          </Col>
          <Col {...colProps}>
            <Item>
              <Input value={tuneData.stockHp!} addonBefore="Stock HP" style={{ width: '100%' }} />
            </Item>
          </Col>
        </Row>
      </Form>
      <Divider>README</Divider>
      <div className="markdown-preview" style={{ height: '100%' }}>
        {tuneData.readme && <ReactMarkdown>
          {`${tuneData.readme}`}
        </ReactMarkdown>}
      </div>
      {canManage && manageSection}
    </div >
  );
};

export default connect(mapStateToProps)(Info);
