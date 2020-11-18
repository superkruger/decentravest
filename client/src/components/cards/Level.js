import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Popover, OverlayTrigger, Tooltip } from 'react-bootstrap'

import './step-progress.css';

const levelRequirements = [
  {title: "intern",       collateralReq: 0,   directReq: 0,    trustReq: 0,  directLimit: 0},
  {title: "junior",       collateralReq: 1,   directReq: 0,    trustReq: 7,  directLimit: 5},
  {title: "analyst",      collateralReq: 2,   directReq: 20,   trustReq: 8,  directLimit: 20},
  {title: "specialist",   collateralReq: 5,   directReq: 50,   trustReq: 9,  directLimit: 50},
  {title: "associate",    collateralReq: 10,  directReq: 100,  trustReq: 9,  directLimit: 100},
  {title: "entrepreneur", collateralReq: 20,  directReq: 200,  trustReq: 10, directLimit: 200},
  {title: "tycoon",       collateralReq: 50,  directReq: 500,  trustReq: 10, directLimit: 500},
  {title: "elite",        collateralReq: 100, directReq: 1000, trustReq: 10, directLimit: 1000}
]

class Level extends Component {

  render() {
    const {level, showInfo} = this.props

    const barStyle = {
      width: '' + ((level + 1) * 12) + '%'
    }

    return (
      <div className="steps">
          <ul className="steps-container">
            { 
              levelRequirements.map((levelRequirement, index) => {
                return (
                    <li key={index} style={{width: '12%'}} className={level === index ? `activated` : ''}>
                    

                      <OverlayTrigger trigger={["hover", "focus"]} placement="bottom" overlay={
                        
                        showInfo ?
                        
                          <Popover id="popover-basic">
                            <Popover.Title as="h3">{levelRequirement.title}</Popover.Title>
                            <Popover.Content>
                              <table className="table very-small">
                                <thead>
                                  <tr>
                                    <th>Requirement</th>
                                    <th>Benefit</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td><b>{levelRequirement.collateralReq}</b> profitable collateral investments</td>
                                    <td rowSpan="3">Direct investments up to <b>{levelRequirement.directLimit * 100}%</b> of collateral limit</td>
                                  </tr>
                                  <tr>
                                    <td><b>{levelRequirement.directReq}</b> profitable direct investments</td>
                                  </tr>
                                  <tr>
                                    <td>Trust rating of <b>{levelRequirement.trustReq}</b></td>
                                  </tr>
                                </tbody>
                              </table>
                            </Popover.Content>
                          </Popover>
                        : 
                          <div></div>
                        
                      }>
                        <div className="step">
                            <div className="step-image"><span></span></div>
                            <div className="step-current">{levelRequirement.title}</div>
                        </div>
                      </OverlayTrigger>
                    
                    </li>
                )
              })
            }
              
              
          </ul>
          <div className="step-bar" style={barStyle}></div>
      </div>
    )
  }
}

function mapStateToProps(state, ownProps) {
  return {
    level: ownProps.level,
    showInfo: ownProps.showInfo
  }
}

export default connect(mapStateToProps)(Level)
