import { generatePath, Link, useMatch, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Layout, Tabs, Progress, Steps, Space, Divider, Typography, Badge, Grid } from 'antd';
import { FileTextOutlined, GlobalOutlined } from '@ant-design/icons';
import { connect } from 'react-redux';
import PerfectScrollbar from 'react-perfect-scrollbar';
import Pako from 'pako';
import { AppState, ToothLogsState, TuneDataState, UIState } from '../types/state';
import store from '../store';
import { formatBytes } from '../utils/numbers';
import CompositeCanvas from '../components/TriggerLogs/CompositeCanvas';
import TriggerLogsParser, {
  CompositeLogEntry,
  ToothLogEntry,
} from '../utils/logs/TriggerLogsParser';
import ToothCanvas from '../components/TriggerLogs/ToothCanvas';
import Loader from '../components/Loader';
import { Colors } from '../utils/colors';
import { Routes } from '../routes';
import { removeFilenameSuffix } from '../pocketbase';
import useServerStorage from '../hooks/useServerStorage';
import { isAbortedRequest } from '../utils/error';
import { collapsedSidebarWidth, sidebarWidth } from '../components/Tune/SideBar';

const { Content } = Layout;

const edgeUnknown = 'Unknown';
const badgeStyle = { backgroundColor: Colors.TEXT };

const mapStateToProps = (state: AppState) => ({
  ui: state.ui,
  status: state.status,
  config: state.config,
  loadedToothLogs: state.toothLogs,
  tuneData: state.tuneData,
});

const Diagnose = ({
  ui,
  loadedToothLogs,
  tuneData,
}: {
  ui: UIState;
  loadedToothLogs: ToothLogsState;
  tuneData: TuneDataState | null;
}) => {
  const { lg } = Grid.useBreakpoint();
  const { Sider } = Layout;
  const [progress, setProgress] = useState(0);
  const [fileSize, setFileSize] = useState<string>();
  const [step, setStep] = useState(0);
  const [edgeLocation, setEdgeLocation] = useState(edgeUnknown);
  const [fetchError, setFetchError] = useState<Error>();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const routeMatch = useMatch(Routes.TUNE_DIAGNOSE_FILE);
  const { fetchLogFileWithProgress } = useServerStorage();
  const navigate = useNavigate();

  const calculateCanvasSize = useCallback(() => {
    setCanvasWidth(contentRef.current?.clientWidth || 0);
    setCanvasHeight(Math.round(window.innerHeight - 115));
  }, []);
  const siderProps = {
    width: sidebarWidth,
    collapsedWidth: collapsedSidebarWidth,
    collapsible: true,
    breakpoint: 'xl',
    collapsed: ui.sidebarCollapsed,
    onCollapse: (collapsed: boolean) => {
      store.dispatch({ type: 'ui/sidebarCollapsed', payload: collapsed });
    },
  };

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const loadData = async () => {
      const logFileName = routeMatch?.params.fileName;

      if (!logFileName) {
        return;
      }

      // user didn't upload any logs
      if (tuneData && (tuneData.toothLogFiles || []).length === 0) {
        navigate(Routes.HUB);

        return;
      }

      try {
        const raw = await fetchLogFileWithProgress(
          tuneData!.id,
          logFileName,
          (percent, total, edge) => {
            setProgress(percent);
            setFileSize(formatBytes(total));
            setEdgeLocation(edge || edgeUnknown);
          },
          signal,
        );

        setFileSize(formatBytes(raw.byteLength));
        setStep(1);

        const parser = new TriggerLogsParser(Pako.inflate(new Uint8Array(raw))).parse();

        let type = '';
        let result: CompositeLogEntry[] | ToothLogEntry[] = [];

        if (parser.isComposite()) {
          type = 'composite';
          result = parser.getCompositeLogs();
        }

        if (parser.isTooth()) {
          type = 'tooth';
          result = parser.getToothLogs();
        }

        store.dispatch({
          type: 'toothLogs/load',
          payload: {
            fileName: logFileName,
            logs: result,
            type,
          },
        });

        setStep(2);
      } catch (error) {
        if (isAbortedRequest(error as Error)) {
          return;
        }

        setFetchError(error as Error);
      }
    };

    // first visit, logs are not loaded yet
    if (!loadedToothLogs.type && tuneData?.tuneId) {
      loadData();
    }

    // file changed, reload
    if (loadedToothLogs.type && loadedToothLogs.fileName !== routeMatch?.params.fileName) {
      // setToothLogs(undefined);
      // setCompositeLogs(undefined);
      store.dispatch({ type: 'toothLogs/load', payload: {} });
      loadData();
    }

    // user navigated to logs root page
    if (!routeMatch?.params.fileName && tuneData && tuneData.toothLogFiles?.length) {
      // either redirect to the first log or to the latest selected
      if (loadedToothLogs.fileName) {
        navigate(
          generatePath(Routes.TUNE_DIAGNOSE_FILE, {
            tuneId: tuneData.tuneId,
            fileName: loadedToothLogs.fileName,
          }),
        );
      } else {
        const firstLogFile = (tuneData.toothLogFiles || [])[0];
        navigate(
          generatePath(Routes.TUNE_DIAGNOSE_FILE, {
            tuneId: tuneData.tuneId,
            fileName: firstLogFile,
          }),
        );
      }
    }

    calculateCanvasSize();

    window.addEventListener('resize', calculateCanvasSize);

    return () => {
      controller.abort();
      window.removeEventListener('resize', calculateCanvasSize);
    };
  }, [calculateCanvasSize, routeMatch?.params.fileName, ui.sidebarCollapsed, tuneData?.tuneId]);

  const Graph = () => {
    switch (loadedToothLogs.type) {
      case 'composite':
        return (
          <CompositeCanvas
            data={loadedToothLogs.logs as CompositeLogEntry[]}
            width={canvasWidth}
            height={canvasHeight}
          />
        );
      case 'tooth':
        return (
          <ToothCanvas data={loadedToothLogs.logs} width={canvasWidth} height={canvasHeight} />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Sider {...(siderProps as any)} className="app-sidebar">
        {loadedToothLogs.type ? (
          !ui.sidebarCollapsed && (
            <Tabs
              defaultActiveKey="files"
              style={{ marginLeft: 20 }}
              items={[
                {
                  label: (
                    <Badge
                      size="small"
                      style={badgeStyle}
                      count={tuneData?.toothLogFiles?.length}
                      offset={[10, -3]}
                    >
                      <FileTextOutlined />
                      Files
                    </Badge>
                  ),
                  key: 'files',
                  children: (
                    <PerfectScrollbar options={{ suppressScrollX: true }}>
                      {tuneData?.toothLogFiles?.map((fileName) => (
                        <Typography.Paragraph key={fileName} ellipsis={true}>
                          <Link
                            to={generatePath(Routes.TUNE_DIAGNOSE_FILE, {
                              tuneId: tuneData.tuneId,
                              fileName,
                            })}
                            style={
                              routeMatch?.params.fileName === fileName ? {} : { color: 'inherit' }
                            }
                          >
                            {removeFilenameSuffix(fileName)}
                          </Link>
                        </Typography.Paragraph>
                      ))}
                    </PerfectScrollbar>
                  ),
                },
              ]}
            />
          )
        ) : (
          <Loader />
        )}
      </Sider>
      <Layout className="logs-container">
        <Content>
          <div ref={contentRef}>
            {loadedToothLogs.type ? (
              <Graph />
            ) : (
              <Space direction="vertical" size="large">
                <Progress type="circle" percent={progress} className="logs-progress" />
                <Divider />
                <Steps
                  current={step}
                  direction={lg ? 'horizontal' : 'vertical'}
                  items={[
                    {
                      title: 'Downloading',
                      subTitle: fileSize,
                      description: fetchError ? (
                        fetchError!.message
                      ) : (
                        <Space>
                          <GlobalOutlined />
                          {edgeLocation}
                        </Space>
                      ),
                    },
                    {
                      title: 'Decoding',
                      description: 'Parsing CSV',
                    },
                    {
                      title: 'Rendering',
                      description: 'Putting pixels on your screen',
                    },
                  ]}
                />
              </Space>
            )}
          </div>
        </Content>
      </Layout>
    </>
  );
};

export default connect(mapStateToProps)(Diagnose);
