import { connect } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import {
  Col,
  Divider,
  Form,
  Input,
  Row,
  Select,
} from 'antd';
import {
  AppState,
  TuneDataState,
} from '../types/state';
import Loader from '../components/Loader';

const { Item } = Form;
const rowProps = { gutter: 10 };
const colProps = { span: 24, sm: 12 };

const mapStateToProps = (state: AppState) => ({
  tuneData: state.tuneData,
});

const Info = ({ tuneData }: { tuneData: TuneDataState }) => {
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
    </div >
  );
};

export default connect(mapStateToProps)(Info);
