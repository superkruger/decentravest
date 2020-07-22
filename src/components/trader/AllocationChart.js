import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import Spinner from '../Spinner'
import {
  accountSelector
} from '../../store/selectors'

am4core.useTheme(am4themes_animated);

class AllocationChart extends Component {
  componentDidMount() {
      this.chartContainer = this.props.showChart ? buildChart(this.props) : null;
  }

  componentWillUnmount() {
    if (this.chartContainer) {
      this.chartContainer.dispose();
    }
  }

  componentDidUpdate(oldProps) {
    if (!this.props.showChart) {
        return;
    }

    if ((oldProps.account === null && this.props.account !== null)
        || ( oldProps.account !== null && this.props.account !== null && JSON.stringify(oldProps.account) !== JSON.stringify(this.props.account))) {
        if (this.chartContainer) {
          this.chartContainer.dispose();
        }
        this.chartContainer = buildChart(this.props);
        return;
    }

    if(JSON.stringify(oldProps.data) !== JSON.stringify(this.props.data)) {
        setChartData(this.chartContainer, this.props.data);
        return;
    }
  }

  render() {
    const {data} = this.props

    return (
        
        <div>
            <span>Allocated: {`${data.formattedTotal}`}</span><br/>
            <span>Invested: {`${data.formattedInvested}`}</span>
            <div id={`${data.symbol}-chartdiv`} style={{ width: "100%", height: "100px" }} />
        </div>
              
    )
  }
}

function buildChart(props) {
    const {data} = props;

    let container = am4core.create(data.symbol + "-chartdiv", am4core.Container);
    container.width = am4core.percent(100);
    container.height = am4core.percent(100);
    container.layout = "vertical";

    createBulletChart(container, [data]);

    return container;
}

function setChartData(parent, data) {
    let child = parent.children.values[0]
    if (child) {
        child.data = [data]
    }
}

function createBulletChart(parent, data) {
    // let colors = ["#B1001C", "#004989"];
    let colors = ["#FFF", "#00dd00"];

    let chart = parent.createChild(am4charts.XYChart);
    chart.paddingRight = 25;

    chart.data = data;

    let categoryAxis = chart.yAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "symbol";
    categoryAxis.renderer.minGridDistance = 30;
    categoryAxis.renderer.grid.template.disabled = true;

    let valueAxis = chart.xAxes.push(new am4charts.ValueAxis());
    valueAxis.renderer.minGridDistance = 30;
    valueAxis.renderer.grid.template.disabled = true;
    valueAxis.min = 0;
    valueAxis.max = 100;
    valueAxis.strictMinMax = true;
    valueAxis.renderer.baseGrid.disabled = true;
    valueAxis.renderer.labels.template.adapter.add("text", function(text, target) {
      return "";
    });

    let gradient = new am4core.LinearGradient();
    for (var i = 0; i < 2; ++i) {
      gradient.addColor(am4core.color(colors[i]));
    }
    createRange(valueAxis, 0, 100, gradient);
  
    let series = chart.series.push(new am4charts.ColumnSeries());
    series.dataFields.valueX = "investedPercentage";
    series.dataFields.categoryY = "symbol";
    series.columns.template.fill = am4core.color("#fff");
    series.columns.template.stroke = am4core.color("#000");
    series.columns.template.strokeWidth = 1;
    series.columns.template.strokeOpacity = 0.5;
    series.columns.template.height = am4core.percent(25);
    series.tooltipText = "{investedPercentage}"

    let series2 = chart.series.push(new am4charts.StepLineSeries());
    series2.dataFields.valueX = "investedPercentageTarget";
    series2.dataFields.categoryY = "symbol";
    series2.strokeWidth = 3;
    series2.noRisers = true;
    series2.startLocation = 0.15;
    series2.endLocation = 0.85;
    series2.tooltipText = "{valueX}"
    series2.stroke = am4core.color("#fff");

    chart.cursor = new am4charts.XYCursor()
    chart.cursor.lineX.disabled = true;
    chart.cursor.lineY.disabled = true;

    valueAxis.cursorTooltipEnabled = false;
    chart.arrangeTooltips = false;
}

function createRange(axis, from, to, color) {
    let range = axis.axisRanges.create();
    range.value = from;
    range.endValue = to;
    range.axisFill.fill = color;
    range.axisFill.fillOpacity = 0.8;
    range.label.disabled = true;
    range.grid.disabled = true;
}

function mapStateToProps(state) {
    const account = accountSelector(state)
    const showChart = account !== null

  return {
    showChart: showChart,
    account: account
  }
}

export default connect(mapStateToProps)(AllocationChart)
