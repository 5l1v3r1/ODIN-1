import { GEOS, InverseRadians, proj, projectPoint, HALF_PI } from './geos-utils'

export default (wkt, width) => {
  const halfWidth = width / 2
  const geometry = GEOS.readWKT(wkt)
  const P_A = geometry.getPointN(-2) // point before last
  const P_B = geometry.getPointN(-1) // last point
  const L_AB = GEOS.createLineString([P_A, P_B]) // last segment
  const { azimuth: ALPHA, distanceSphere: D_AB } = InverseRadians(P_A, P_B)
  const ARROW_LENGTH = 0.76 * width
  const ARROW_L_AB_RATIO = ARROW_LENGTH / D_AB
  const P_C = L_AB.interpolateNormalized(1 - ARROW_L_AB_RATIO)
  const L_BC = GEOS.createLineString([P_B, P_C])

  const BUFFER = geometry
    .transform((x, y) => proj.forward([x, y]))
    .buffer(halfWidth, 16, GEOS.CAP_FLAT, GEOS.JOIN_ROUND)
    .transform((x, y) => proj.inverse([x, y]))

  // TODO: directly create POLYGON not LINE_STRING
  const ARROW = GEOS.createLineString([
    P_B,
    projectPoint(P_C, width, ALPHA - HALF_PI),
    projectPoint(P_C, halfWidth, ALPHA - HALF_PI),
    L_BC.interpolateNormalized(0.5),
    projectPoint(P_C, halfWidth, ALPHA + HALF_PI),
    projectPoint(P_C, width, ALPHA + HALF_PI),
    P_B
  ]).asPolygon()

  // FIXME: crazy hack ahead:
  const filterGeometry = p => collection => {
    const geometries = []
    const numGeometries = collection.getNumGeometries()
    for (let i = 0; i < numGeometries; i++) {
      const geometry = collection.getGeometryN(i)
      if (p(geometry)) geometries.push(geometry)
    }

    return geometries
  }

  const buffer = filterGeometry(geometry => {
    return geometry.asBoundary().getNumPoints() !== 4
  })(BUFFER.difference(ARROW))

  // TODO: support asBoundary() for arbitrary geometries
  return GEOS.createCollection([
    buffer[0],
    ARROW.asBoundary()
  ])
}
