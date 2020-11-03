import React from 'react'
import { Popover, OverlayTrigger } from 'react-bootstrap'

export default function ({ helpKey, title, content, placement }) {

    if (!placement) {
      placement = "right"
    }

    const popover = (
      <Popover id={`popover-help-${helpKey}`}>
        <Popover.Title as="h3">{title}</Popover.Title>
        <Popover.Content>{content}</Popover.Content>
      </Popover>
    );

    return(
      <OverlayTrigger trigger="click" placement={placement} overlay={popover}>
        <i className="fas fa-info-circle fa-2x text-gray-300 help"></i>
      </OverlayTrigger>
    )
}