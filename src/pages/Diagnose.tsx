/* eslint-disable import/no-webpack-loader-syntax */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Layout,
  Tabs,
  Progress,
  Steps,
  Space,
  Divider,
  Typography,
} from 'antd';
import {
  FileTextOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import * as Sentry from '@sentry/browser';
import pako from 'pako';
import useBreakpoint from 'antd/lib/grid/hooks/useBreakpoint';
import { connect } from 'react-redux';
import PerfectScrollbar from 'react-perfect-scrollbar';
import {
  Config,
  Logs,
} from '@speedy-tuner/types';
import {
  AppState,
  UIState,
} from '../types/state';
import {
  loadCompositeLogs,
  loadToothLogs,
} from '../utils/api';
import store from '../store';
import { formatBytes } from '../utils/number';
import CompositeCanvas from '../components/TriggerLogs/CompositeCanvas';
import TriggerLogsParser, {
  CompositeLogEntry,
  ToothLogEntry,
} from '../utils/logs/TriggerLogsParser';
import ToothCanvas from '../components/TriggerLogs/ToothCanvas';
import Loader from '../components/Loader';

const { TabPane } = Tabs;
const { Content } = Layout;
const { Step } = Steps;

const edgeUnknown = 'Unknown';

const mapStateToProps = (state: AppState) => ({
  ui: state.ui,
  status: state.status,
  config: state.config,
  loadedLogs: state.logs,
});

const margin = 30;
const sidebarWidth = 250;
const minCanvasHeightInner = 600;

const Diagnose = ({ ui, config, loadedLogs }: { ui: UIState, config: Config, loadedLogs: Logs }) => {
  const { lg } = useBreakpoint();
  const { Sider } = Layout;
  const [progress, setProgress] = useState(0);
  const [fileSize, setFileSize] = useState<string>();
  const [step, setStep] = useState(0);
  const [edgeLocation, setEdgeLocation] = useState(edgeUnknown);
  const [fetchError, setFetchError] = useState<Error>();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const calculateCanvasSize = useCallback(() => {
    setCanvasWidth((contentRef.current?.clientWidth || 0) - margin);

    if (window.innerHeight > minCanvasHeightInner) {
      setCanvasHeight(Math.round((window.innerHeight - 250) / 2));
    } else {
      setCanvasHeight(minCanvasHeightInner / 2);
    }
  }, []);
  const siderProps = {
    width: sidebarWidth,
    collapsible: true,
    breakpoint: 'xl',
    collapsed: ui.sidebarCollapsed,
    onCollapse: (collapsed: boolean) => {
      store.dispatch({ type: 'ui/sidebarCollapsed', payload: collapsed });
    },
  };
  const [logs, setLogs] = useState<CompositeLogEntry[]>();
  const [toothLogs, setToothLogs] = useState<ToothLogEntry[]>();

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const loadData = async () => {
      try {
        const compositeRaw = await loadCompositeLogs((percent, total, edge) => {
          setProgress(percent);
          setFileSize(formatBytes(total));
          setEdgeLocation(edge || edgeUnknown);
        }, signal);

        const toothRaw = await loadToothLogs(undefined, signal);

        setFileSize(formatBytes(compositeRaw.byteLength));
        setStep(1);

        const resultComposite = (new TriggerLogsParser(pako.inflate(new Uint8Array(compositeRaw))))
          .parse()
          .getCompositeLogs();
        const resultTooth = (new TriggerLogsParser(pako.inflate(new Uint8Array(toothRaw))))
          .parse()
          .getToothLogs();

        setLogs(resultComposite);
        setToothLogs(resultTooth);

        setStep(2);
      } catch (error) {
        setFetchError(error as Error);
        Sentry.captureException(error);
        console.error(error);
      }
    };

    loadData();
    calculateCanvasSize();

    window.addEventListener('resize', calculateCanvasSize);

    return () => {
      controller.abort();
      window.removeEventListener('resize', calculateCanvasSize);
    };
  }, [calculateCanvasSize, loadedLogs, ui.sidebarCollapsed]);

  return (
    <>
      <Sider {...(siderProps as any)} className="app-sidebar">
        {!logs && !loadedLogs.length ?
          <Loader />
          :
          !ui.sidebarCollapsed &&
          <Tabs defaultActiveKey="files" style={{ marginLeft: 20 }}>
            <TabPane tab={<FileTextOutlined />} key="files">
              <PerfectScrollbar options={{ suppressScrollX: true }}>
                <Typography.Paragraph>tooth.csv</Typography.Paragraph>
                <Typography.Paragraph>composite.csv</Typography.Paragraph>
              </PerfectScrollbar>
            </TabPane>
          </Tabs>
        }
      </Sider>
      <Layout style={{ width: '100%', textAlign: 'center', marginTop: 50 }}>
        <Content>
          <div ref={contentRef} style={{ width: '100%', marginRight: margin }}>
            {toothLogs && logs
              ?
              (
                <Space direction="vertical" size="large">
                  <ToothCanvas
                    data={toothLogs!}
                    width={canvasWidth}
                    height={canvasHeight}
                  />
                  <CompositeCanvas
                    data={logs!}
                    width={canvasWidth}
                    height={canvasHeight}
                  />
                </Space>
              )
              :
              <Space
                direction="vertical"
                size="large"
                style={{ width: '80%', maxWidth: 1000 }}
              >
                <Progress
                  type="circle"
                  percent={progress}
                  width={170}
                />
                <Divider />
                <Steps current={step} direction={lg ? 'horizontal' : 'vertical'}>
                  <Step
                    title="Downloading"
                    subTitle={fileSize}
                    description={
                      fetchError ? fetchError!.message : <Space>
                        <GlobalOutlined />{edgeLocation}
                      </Space>
                    }
                  />
                  <Step
                    title="Decoding"
                    description="Parsing CSV"
                  />
                  <Step
                    title="Rendering"
                    description="Putting pixels on your screen"
                  />
                </Steps>
              </Space>
            }
          </div>
        </Content>
      </Layout>
    </>
  );
};

export default connect(mapStateToProps)(Diagnose);
