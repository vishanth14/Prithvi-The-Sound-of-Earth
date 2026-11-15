import * as THREE from 'three';

/**
 * Converts Latitude and Longitude to local 3D Cartesian coordinates on a sphere.
 *
 * Matches Three.js standard SphereGeometry UV parameterization:
 * - Latitude: [-90, +90] deg -> Y: [-radius, +radius]
 * - Longitude: [-180, +180] deg -> XZ plane
 *   - Lng 0 (Prime Meridian, Greenwich): X = +radius, Z = 0
 *   - Lng -90 (Americas): X = 0, Z = +radius
 *   - Lng +90 (Indian Ocean): X = 0, Z = -radius
 *   - Lng -180 / +180 (Antimeridian): X = -radius, Z = 0
 */
export function latLngToVector3(
  lat: number,
  lng: number,
  radius = 2.016
): THREE.Vector3 {
  const phi = (lat * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;

  const x = -radius * Math.cos(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi);
  const z = radius * Math.cos(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

/**
 * Computes the exact World Coordinate position of a latitude/longitude coordinate
 * on the rotating Earth globe, accounting for:
 * 1. Polar axial tilt (rotation.x = 0.41 rad ~ 23.44°)
 * 2. Real-time planetary rotation (rotation.y)
 * 3. Dynamic observer tilt/roll (rotation.x, rotation.z)
 * 4. Scale and parent group transformations
 */
export function getSentinelWorldPosition(
  lat: number,
  lng: number,
  earthGroup: THREE.Group,
  radius = 2.016
): THREE.Vector3 {
  earthGroup.updateMatrixWorld(true);
  const localPos = latLngToVector3(lat, lng, radius);
  return localPos.applyMatrix4(earthGroup.matrixWorld);
}

/**
 * Interpolates two unit direction vectors along the great-circle arc (spherical slerp).
 * Handles antipodal direction vectors gracefully.
 */
export function slerpDirectionVectors(
  vStart: THREE.Vector3,
  vEnd: THREE.Vector3,
  alpha: number
): THREE.Vector3 {
  const startNorm = vStart.clone().normalize();
  const endNorm = vEnd.clone().normalize();

  const dot = THREE.MathUtils.clamp(startNorm.dot(endNorm), -1, 1);

  // If vectors are virtually identical, return start
  if (dot > 0.9999) {
    return startNorm;
  }

  // If vectors are directly opposite (antipodal, dot ~ -1), choose a deterministic perpendicular axis
  if (dot < -0.9999) {
    const perp = Math.abs(startNorm.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const ortho = startNorm.clone().cross(perp).normalize();
    const q = new THREE.Quaternion().setFromAxisAngle(ortho, Math.PI * alpha);
    return startNorm.clone().applyQuaternion(q).normalize();
  }

  const q = new THREE.Quaternion().setFromUnitVectors(startNorm, endNorm);
  const qIdentity = new THREE.Quaternion();
  const qCurrent = new THREE.Quaternion().slerpQuaternions(qIdentity, q, alpha);

  return startNorm.clone().applyQuaternion(qCurrent).normalize();
}
