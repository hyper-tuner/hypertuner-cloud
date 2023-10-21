import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  Config as ConfigType,
  ConstantTypes,
  Curve as CurveType,
  Dialog as DialogType,
  Dialogs as DialogsType,
  Field as FieldType,
  ScalarConstant as ScalarConstantType,
  Table as TableType,
  Tune as TuneType,
} from '@hyper-tuner/types';
import { Col, Divider, Form, Popover, Result, Row, Space } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import useBrowserStorage from '../../hooks/useBrowserStorage';
import useConfig from '../../hooks/useConfig';
import { AppState, UIState } from '../../types/state';
import { evaluateExpression } from '../../utils/tune/expression';
import { parseXy, parseZ } from '../../utils/tune/table';
import Loader from '../Loader';
import Curve from './Dialog/Curve';
import Map3D from './Dialog/Map3D';
import SmartNumber from './Dialog/SmartNumber';
import SmartSelect from './Dialog/SmartSelect';
import TextField from './Dialog/TextField';

type DialogsAndCurves = Record<string, DialogType | CurveType | TableType>;

interface RenderedPanel {
  type: string;
  name: string;
  title: string;
  labels: string[];
  xAxis: number[];
  yAxis: number[];
  xBins: string[];
  yBins: string[];
  size: number[];
  gauge?: string;
  fields: FieldType[];
  map: string;
  page: number;
  help?: string;
  xyLabels: string[];
  zBins: string[];
  gridHeight: number;
  gridOrient: number[];
  upDownLabel: string[];
}

enum PanelTypes {
  FIELDS = 'fields',
  CURVE = 'curve',
  TABLE = 'table',
}

const mapStateToProps = (state: AppState) => ({
  config: state.config,
  tune: state.tune,
  ui: state.ui,
});

// TODO: refactor this
const Dialog = ({
  ui,
  config,
  tune,
  url,
  name,
}: {
  ui: UIState;
  config: ConfigType | null;
  tune: TuneType | null;
  name: string;
  url: string;
}) => {
  const isDataReady =
    tune && config && Object.keys(tune.constants).length && Object.keys(config.constants).length;
  const { storageSet } = useBrowserStorage();
  const { findConstantOnPage } = useConfig(config);
  const [panelsComponents, setPanelsComponents] = useState<(React.JSX.Element | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const renderHelp = (link?: string) =>
    link && (
      <Popover
        content={
          <a href={`${link}`} target="__blank" rel="noopener noreferrer">
            {link}
          </a>
        }
        placement="right"
      >
        <QuestionCircleOutlined />
      </Popover>
    );

  const renderCurve = useCallback(
    (curve: CurveType) => {
      const x = tune!.constants[curve.xBins[0]];
      const y = tune!.constants[curve.yBins[0]];
      const xConstant = findConstantOnPage(curve.xBins[0]) as ScalarConstantType;
      const yConstant = findConstantOnPage(curve.yBins[0]) as ScalarConstantType;

      return (
        <Curve
          key={curve.yBins[0]}
          // disabled={false} // TODO: evaluate condition
          help={config!.help[curve.yBins[0]]}
          xLabel={curve.labels[0]}
          yLabel={curve.labels[1]}
          xUnits={xConstant.units}
          yUnits={yConstant.units}
          xData={parseXy(x.value as string)}
          yData={parseXy(y.value as string)}
        />
      );
    },
    [config?.help, findConstantOnPage, tune?.constants],
  );

  const renderTable = useCallback(
    (table: TableType | RenderedPanel) => {
      const x = tune?.constants[table.xBins[0]];
      const y = tune?.constants[table.yBins[0]];
      const z = tune?.constants[table.zBins[0]];

      if (!(x && y)) {
        // TODO: handle this (rusEFI: fuel/lambdaTableTbl)
        return null;
      }

      const zConstant = findConstantOnPage(table.zBins[0]) as ScalarConstantType;

      return (
        <div>
          {renderHelp(table.help)}
          <Map3D
            key={table.map}
            xData={parseXy(x.value as string)}
            yData={parseXy(y.value as string).reverse()}
            zData={parseZ(z?.value as string)}
            xUnits={x.units!}
            yUnits={y.units!}
            zDigits={zConstant.digits}
          />
        </div>
      );
    },
    [findConstantOnPage, tune?.constants],
  );

  const resolvedDialogs: DialogsAndCurves = {};

  const resolveDialogs = (source: DialogsType, dialogName: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!source[dialogName]) {
      return;
    }

    // resolve root dialog
    resolvedDialogs[dialogName] = source[dialogName];

    Object.keys(source[dialogName].panels).forEach((panelName: string) => {
      const currentDialog = source[panelName];

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!currentDialog) {
        // resolve 2D map / curve panel
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (config!.curves[panelName]) {
          resolvedDialogs[panelName] = {
            ...config!.curves[panelName],
          };

          return;
        }

        // resolve 3D map / table panel
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (config!.tables[panelName]) {
          resolvedDialogs[panelName] = {
            ...config!.tables[panelName],
          };

          return;
        }

        console.warn('Unable to resolve panel:', panelName);

        return;
      }

      if (currentDialog.fields.length > 0) {
        // resolve in root scope
        resolvedDialogs[panelName] = config!.dialogs[panelName];
      }

      // recursion
      resolveDialogs(config!.dialogs, panelName);
    });
  };

  if (config?.dialogs) {
    resolveDialogs(config.dialogs, name);
  }

  // remove dummy dialogs and flatten to array
  const panels = Object.keys(resolvedDialogs).map((dialogName: string): RenderedPanel => {
    const currentDialog: DialogType | CurveType | TableType = resolvedDialogs[dialogName];
    let type = PanelTypes.CURVE;
    let fields: FieldType[] = [];

    if ('fields' in currentDialog) {
      type = PanelTypes.FIELDS;
      fields = currentDialog.fields.filter((field) => field.title !== '');
    } else if ('zBins' in currentDialog) {
      type = PanelTypes.TABLE;
    }

    return {
      type,
      name: dialogName,
      title: currentDialog.title,
      fields,
      labels: (currentDialog as CurveType).labels,
      xAxis: (currentDialog as CurveType).xAxis,
      yAxis: (currentDialog as CurveType).yAxis,
      xBins: (currentDialog as CurveType).xBins,
      yBins: (currentDialog as CurveType).yBins,
      size: (currentDialog as CurveType).size,
      gauge: (currentDialog as CurveType).gauge,
      map: (currentDialog as TableType).map,
      page: (currentDialog as TableType).page,
      help: (currentDialog as TableType).help,
      xyLabels: (currentDialog as TableType).xyLabels,
      zBins: (currentDialog as TableType).zBins,
      gridHeight: (currentDialog as TableType).gridHeight,
      gridOrient: (currentDialog as TableType).gridOrient,
      upDownLabel: (currentDialog as TableType).upDownLabel,
    };
  });

  const generatePanelsComponents = useCallback(
    () =>
      panels.map((panel: RenderedPanel) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (panel.type === PanelTypes.FIELDS && panel.fields.length === 0) {
          return null;
        }

        return (
          <Col key={panel.name} span={24}>
            <Divider>{panel.title}</Divider>
            {panel.fields.map((field: FieldType) => {
              const constant = findConstantOnPage(field.name);
              const tuneField = tune!.constants[field.name];
              const help = config!.help[field.name];
              let input;
              let enabled = true;
              const fieldKey = `${panel.name}-${field.title}`;

              if (field.condition) {
                // TODO: optimize it
                enabled = evaluateExpression(field.condition, tune!.constants, config!) as boolean;
              }

              if (field.name === '_fieldText_' && enabled) {
                return <TextField key={fieldKey} title={field.title} />;
              }

              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              if (!tuneField) {
                // TODO: handle this?
                // name: "rpmwarn", title: "Warning",
                return null;
              }

              switch (constant.type) {
                // case ConstantTypes.ARRAY: // TODO: arrays
                case ConstantTypes.BITS: {
                  input = (
                    <SmartSelect
                      defaultValue={`${tuneField.value}`}
                      values={constant.values}
                      disabled={!enabled}
                    />
                  );
                  break;
                }

                case ConstantTypes.SCALAR: {
                  input = (
                    <SmartNumber
                      defaultValue={Number(tuneField.value)}
                      digits={(constant as ScalarConstantType).digits}
                      min={((constant as ScalarConstantType).min as number) || 0}
                      max={(constant as ScalarConstantType).max as number}
                      disabled={!enabled}
                      units={(constant as ScalarConstantType).units}
                    />
                  );
                  break;
                }

                default:
                  break;
              }

              return (
                <Form.Item
                  key={fieldKey}
                  label={
                    <Space>
                      {field.title}
                      {help && (
                        <Popover
                          content={help.split('\\n').map((line) => (
                            <div key={line}>{line}</div>
                          ))}
                        >
                          <QuestionCircleOutlined />
                        </Popover>
                      )}
                    </Space>
                  }
                >
                  {input}
                </Form.Item>
              );
            })}

            {panel.type === (PanelTypes.CURVE as string) && renderCurve(panel)}
            {panel.type === (PanelTypes.TABLE as string) && renderTable(panel)}
          </Col>
        );
      }),
    [config, findConstantOnPage, panels, renderCurve, renderTable, tune?.constants],
  );

  useEffect(() => {
    storageSet('lastDialog', url);

    if (isDataReady) {
      setPanelsComponents(generatePanelsComponents());
    }
  }, [isDataReady, url, ui.sidebarCollapsed]);

  if (!isDataReady) {
    return <Loader />;
  }

  const dialogConfig = config.dialogs[name];
  const curveConfig = config.curves[name];
  const tableConfig = config.tables[name];

  // standalone dialog / page
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!dialogConfig) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (curveConfig) {
      return (
        <div ref={containerRef} className="large-container">
          <Divider>{curveConfig.title}</Divider>
          {renderCurve(curveConfig)}
        </div>
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (tableConfig) {
      return (
        <div ref={containerRef} className="large-container">
          {renderHelp(tableConfig.help)}
          <Divider>{tableConfig.title}</Divider>
          {renderTable(tableConfig)}
        </div>
      );
    }

    return <Result status="warning" title="Dialog not found" style={{ marginTop: 50 }} />;
  }

  return (
    <div ref={containerRef} className="large-container">
      {renderHelp(dialogConfig.help)}
      <Form labelCol={{ span: 10 }} wrapperCol={{ span: 10 }}>
        <Row gutter={20}>{panelsComponents}</Row>
      </Form>
    </div>
  );
};

export default connect(mapStateToProps)(Dialog);
