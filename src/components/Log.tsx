import {
  useEffect,
  useState,
} from 'react';
import {
  Spin,
  Layout,
  Tabs,
  Space,
} from 'antd';
import {
  FileTextOutlined,
  EditOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { Parser } from 'mlg-converter';
import { Result as ParserResult } from 'mlg-converter/dist/types';
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

  useEffect(() => {
    loadLogs()
      .then((data) => {
        setIsLoading(true);
        const parsed = new Parser(data).parse();
        setLogs(parsed);
        setIsLoading(false);
        console.log(parsed);

        // plot(parsed.records as any);
      });
  }, []);

  return (
    <>
      <Sider {...siderProps} className="app-sidebar">
        <Tabs defaultActiveKey="files" style={{ marginLeft: 20 }}>
          <TabPane tab={<FileTextOutlined />} key="files">
            <PerfectScrollbar options={{ suppressScrollX: true }}>
              Content of Tab Pane 1
            </PerfectScrollbar>
          </TabPane>
          <TabPane tab={<DashboardOutlined />} key="gauges">
            Content of Tab Pane 2
          </TabPane>
          <TabPane tab={<EditOutlined />} key="fields">
            Content of Tab Pane 3
          </TabPane>
        </Tabs>
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
