// Keep a short look-ahead so a sheep crossing the path after a tap is also seen.
export function visitorStep(from, goal, stride, obstacles, allowed) {
  const dx = goal.x - from.x, dz = goal.z - from.z;
  const distance = Math.hypot(dx, dz);
  if (!distance) return from;
  const heading = Math.atan2(dz, dx);
  const ahead = Math.min(distance, Math.max(stride, 1.5));
  const nearby = obstacles.filter(o =>
    Math.abs(o.x - from.x) <= ahead + o.radius &&
    Math.abs(o.z - from.z) <= ahead + o.radius);
  // Test the swept segment, and allow escape if a moving sheep overlaps us.
  function clear(ux, uz) {
    return nearby.every(o => {
      const x = o.x - from.x, z = o.z - from.z;
      const projection = x * ux + z * uz;
      if (projection <= 0) return true;
      const nearest = Math.min(ahead, projection);
      return Math.hypot(x - ux * nearest, z - uz * nearest) >= o.radius;
    });
  }
  for (let turn = 0; turn <= 8; turn++) {
    for (const side of turn ? [1, -1] : [1]) {
      const angle = heading + side * turn * Math.PI / 16;
      const ux = Math.cos(angle), uz = Math.sin(angle);
      if (!clear(ux, uz)) continue;
      const next = {x: from.x + ux * stride, z: from.z + uz * stride};
      if (allowed(next)) return next;
    }
  }
  return from;
}
