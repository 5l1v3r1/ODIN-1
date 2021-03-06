import L from 'leaflet'
import { line, calcStruts2 } from '../features/geo-helper'
import { shape } from '../features/react-shape'
import '../features/Corridor2Point'

const DRT = L.TACGRP.Corridor2Point.extend({

  _shape (group) {
    const options = { ...this._shapeOptions }
    return shape(group, options, {
      points: ({ center, envelope }) => {
        const s = calcStruts2(center, envelope)([
          0, 0.25, 0.5, 1.25,
          0.1, 0.35, 0.6
        ])
        return [
          envelope[1],
          [envelope[1][0], envelope[0][0]],
          [s[3].point(0.5), s[1].point(0.5)],
          [envelope[1][1], s[2].point(1)],
          [s[4].point(-0.1), s[0].point(0), s[4].point(0.1)],
          [s[5].point(0.4), s[1].point(0.5), s[5].point(0.6)],
          [s[6].point(1.1), s[2].point(1), s[6].point(0.9)]
        ]
      }
    })
  }
})


L.Feature['G*T*T-----'] = (feature, options) => {
  options.labels = () => [{
    placement: ({ center }) => line(center).point(0.75),
    lines: ['D'],
    'font-size': 18,
    angle: ({ center }) => line(center).angle()
  }]

  return new DRT(feature, options)
}
