import React, { Component } from 'react'
import { connect } from 'react-redux'

import * as am4core from "@amcharts/amcharts4/core"
import * as am4charts from "@amcharts/amcharts4/charts"
import am4themes_animated from "@amcharts/amcharts4/themes/animated"

am4core.useTheme(am4themes_animated);

class DateLineChart extends Component {

  componentDidMount() {
    this.chartContainer = buildChart(this.props);
  }

  componentWillUnmount() {
    if (this.chartContainer) {
      this.chartContainer.dispose();
    }
  }

  componentDidUpdate(oldProps) {

    if ((oldProps.title === null && this.props.title !== null)
        || ( oldProps.title !== null && this.props.title !== null && JSON.stringify(oldProps.title) !== JSON.stringify(this.props.title))) {
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
    const {title} = this.props

    return (
      <div>
        <div className="card shadow mb-4">
          {/* Card Header - Dropdown */}
          <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
            <h6 className="m-0 font-weight-bold text-primary">{title}</h6>
          </div>
          {/* Card Body */}
          <div className="card-body">
            <div id={`${title}-linechartdiv`} style={{ width: "100%", minHeight: "200px" }} />
          </div>
        </div>
      </div>
    )
  }
}

function buildChart(props) {
    const {title} = props;

    let container = am4core.create(title + "-linechartdiv", am4core.Container);
    container.width = am4core.percent(100);
    container.height = am4core.percent(100);
    container.layout = "horizontal";

    createLineChart(container, props);

    return container;
}

function setChartData(container, data) {
    let child = container.children.values[0]
    if (child) {
        child.data = data
        child.invalidateData()
    }
}

function createLineChart(container, props) {
  const {data} = props;

  console.log("--- createLineChart ---", data)

  let chart = container.createChild(am4charts.XYChart);

  chart.data = data;

  // Create axes
  var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
  dateAxis.renderer.minGridDistance = 60;

  var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

  // Create series
  var series = chart.series.push(new am4charts.LineSeries());
  series.dataFields.valueY = "value";
  series.dataFields.dateX = "date";
  series.tooltipText = "{value}"

  series.tooltip.pointerOrientation = "vertical";

  chart.cursor = new am4charts.XYCursor();
  chart.cursor.snapToSeries = series;
  chart.cursor.xAxis = dateAxis;

  //chart.scrollbarY = new am4core.Scrollbar();
  chart.scrollbarX = new am4core.Scrollbar();
}

function mapStateToProps(state, ownProps) {
  return {
    title: ownProps.title,
    data: ownProps.data
  }
}

export default connect(mapStateToProps)(DateLineChart)


