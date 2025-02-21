export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  points: Point[];
  center: Point;
  directionVector: Point;
  distanceFromCenter: number;
}

export type AnimationConfig = {
  size: number;
  padding: number;
  animationSpeed: number;
  scaleFactor: number;
  maxRandomCount: number;
  minRandomCount: number;
  maxBaseOffset: number;
  distanceMultiplier: number;
};
