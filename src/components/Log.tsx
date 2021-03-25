import {
  useEffect,
  useState,
} from 'react';
import {
  Spin,
  Layout,
  Tabs,
  Checkbox,
  Row,
  Skeleton,
} from 'antd';
import {
  FileTextOutlined,
  EditOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import { Parser } from 'mlg-converter';
import { Field, Result as ParserResult } from 'mlg-converter/dist/types';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { loadLogs } from '../utils/api';
import Canvas, { LogEntry } from './Log/Canvas';

// const { SubMenu } = Menu;
const { TabPane } = Tabs;
const { Content } = Layout;

const Log = () => {
  const { Sider } = Layout;
  const sidebarWidth = 250;
  const siderProps = {
    width: sidebarWidth,
    collapsible: true,
    breakpoint: 'xl',
    // collapsed: ui.sidebarCollapsed,
    // onCollapse: (collapsed: boolean) => store.dispatch({ type: 'ui/sidebarCollapsed', payload: collapsed }),
  } as any;
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<ParserResult>();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFields, setSelectedFields] = useState<CheckboxValueType[]>([
    'RPM',
    'TPS',
    'AFR Target',
    'AFR',
    'MAP',
  ]);

  useEffect(() => {
    loadLogs()
      .then((data) => {
        setIsLoading(true);
        const parsed = new Parser(data).parse();
        setLogs(parsed);
        setIsLoading(false);
        setFields(parsed.fields);

        console.log(parsed);
      });
  }, []);

  return (
    <>
      <Sider {...siderProps} className="app-sidebar">
        {isLoading ?
          <Skeleton />
          :
            <Tabs defaultActiveKey="fields" style={{ marginLeft: 20 }}>
            <TabPane tab={<EditOutlined />} key="fields">
              <PerfectScrollbar options={{ suppressScrollX: true }}>
                <Checkbox.Group onChange={setSelectedFields} value={selectedFields}>
                  {fields.map((field) => (
                    <Row key={field.name}>
                      <Checkbox key={field.name} value={field.name}>{field.name}</Checkbox>
                    </Row>
                  ))}
                </Checkbox.Group>
              </PerfectScrollbar>
            </TabPane>
            <TabPane tab={<FileTextOutlined />} key="files">
              <PerfectScrollbar options={{ suppressScrollX: true }}>
                Files
              </PerfectScrollbar>
            </TabPane>
            <TabPane tab={<DashboardOutlined />} key="gauges">
              Gauges
            </TabPane>
          </Tabs>
        }
      </Sider>
      <Layout style={{ width: '100%', textAlign: 'center', marginTop: 50 }}>
        <Content>
          {isLoading ?
            <Spin size="large" />
            :
            <Canvas data={logs!.records as LogEntry[]} />
          }
        </Content>
      </Layout>
    </>
  );
};

export default Log;
