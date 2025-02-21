import { AnimationConfig, Point, Shape } from "./types";

export class AnimatedSquare {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly config: AnimationConfig;
  private shapes: Shape[] = [];
  private phase = Math.PI;
  private previousPhase = this.phase;
  private maxDistance = 0;
  private maxTotalOffset = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    config?: Partial<AnimationConfig>
  ) {
    this.config = {
      size: 300,
      padding: 240,
      animationSpeed: 0.012,
      scaleFactor: 1.4,
      maxRandomCount: 10,
      minRandomCount: 5,
      maxBaseOffset: 100,
      distanceMultiplier: 0.5,
      ...config,
    };

    this.ctx = this.initCanvasContext();
    this.shapes = this.initShapes();
    this.initAnimation();
  }

  private initCanvasContext(): CanvasRenderingContext2D {
    const { size, padding } = this.config;

    this.canvas.width = size + padding * 2;
    this.canvas.height = size + padding * 2;

    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");
    return ctx;
  }

  private initShapes(): Shape[] {
    const verticalLines = this.generateRandomLines();
    const horizontalLines = this.generateRandomLines();

    const shapes = this.createShapes(verticalLines, horizontalLines);
    this.calculateOffsets(shapes);

    return shapes;
  }

  private generateRandomLines(): number[] {
    const { padding, size, minRandomCount, maxRandomCount } = this.config;
    const lineCount =
      Math.floor(Math.random() * (maxRandomCount - minRandomCount + 1)) +
      minRandomCount;

    return Array.from(
      { length: lineCount },
      () => padding + Math.random() * size
    );
  }

  private createShapes(
    verticalLines: number[],
    horizontalLines: number[]
  ): Shape[] {
    const { padding, size } = this.config;
    const sections = {
      vertical: [
        padding,
        ...verticalLines.sort((a, b) => a - b),
        padding + size,
      ],
      horizontal: [
        padding,
        ...horizontalLines.sort((a, b) => a - b),
        padding + size,
      ],
    };

    return sections.vertical.slice(0, -1).flatMap((xStart, i) =>
      sections.horizontal.slice(0, -1).map((yStart, j) => {
        const points = this.createShapePoints(
          xStart,
          sections.vertical[i + 1],
          yStart,
          sections.horizontal[j + 1]
        );

        return this.createShape(points);
      })
    );
  }

  private createShapePoints(
    xStart: number,
    xEnd: number,
    yStart: number,
    yEnd: number
  ): Point[] {
    return [
      { x: xStart, y: yStart },
      { x: xEnd, y: yStart },
      { x: xEnd, y: yEnd },
      { x: xStart, y: yEnd },
    ];
  }

  private createShape(points: Point[]): Shape {
    const center = this.calculateCenter(points);

    return {
      points,
      center,
      directionVector: this.calculateDirectionVector(center),
      distanceFromCenter: this.calculateDistanceFromCenter(center),
    };
  }

  private calculateOffsets(shapes: Shape[]): void {
    this.maxDistance = Math.max(...shapes.map((s) => s.distanceFromCenter));
    this.maxTotalOffset =
      this.config.maxBaseOffset +
      this.maxDistance * this.config.distanceMultiplier;
  }

  private calculateCenter(points: Point[]): Point {
    const sum = points.reduce(
      (acc, p) => ({
        x: acc.x + p.x,
        y: acc.y + p.y,
      }),
      { x: 0, y: 0 }
    );

    return {
      x: sum.x / points.length,
      y: sum.y / points.length,
    };
  }

  private calculateDirectionVector(center: Point): Point {
    const squareCenter = this.getSquareCenter();
    const dx = center.x - squareCenter.x;
    const dy = center.y - squareCenter.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    return { x: dx / length, y: dy / length };
  }

  private calculateDistanceFromCenter(center: Point): number {
    const squareCenter = this.getSquareCenter();
    const dx = center.x - squareCenter.x;
    const dy = center.y - squareCenter.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  private getSquareCenter(): Point {
    return {
      x: this.config.size / 2 + this.config.padding,
      y: this.config.size / 2 + this.config.padding,
    };
  }

  private initAnimation(): void {
    const animate = () => {
      this.updateAnimation();
      requestAnimationFrame(animate);
    };
    animate();
  }

  private updateAnimation(): void {
    this.previousPhase = this.phase;
    this.phase += this.config.animationSpeed;
    this.checkForPeak();
    this.draw();
  }

  private checkForPeak(): void {
    const prevMod = this.previousPhase % (2 * Math.PI);
    const currentMod = this.phase % (2 * Math.PI);

    if (prevMod < Math.PI && currentMod >= Math.PI) {
      this.regenerateShapes();
    }
  }

  private regenerateShapes(): void {
    this.shapes = this.initShapes();
    this.calculateOffsets(this.shapes);
  }

  private draw(): void {
    this.clearCanvas();

    const progress = (Math.cos(this.phase) + 1) / 2;
    const animationParams = {
      scale: 1 + progress * (this.config.scaleFactor - 1),
      baseOffset: progress * this.config.maxBaseOffset,
      totalOffset: progress * this.maxTotalOffset,
    };

    this.shapes.forEach((shape) => this.drawShape(shape, animationParams));
  }

  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawShape(
    shape: Shape,
    {
      scale,
      baseOffset,
      totalOffset,
    }: {
      scale: number;
      baseOffset: number;
      totalOffset: number;
    }
  ): void {
    const individualOffset = this.calculateIndividualOffset(
      shape,
      baseOffset,
      totalOffset
    );

    this.ctx.save();
    this.applyTransformations(shape, individualOffset, scale);
    this.drawShapePath(shape);
    this.ctx.restore();
  }

  private calculateIndividualOffset(
    shape: Shape,
    baseOffset: number,
    totalOffset: number
  ): number {
    const distanceFactor = shape.distanceFromCenter / this.maxDistance;
    return baseOffset + (totalOffset - baseOffset) * distanceFactor;
  }

  private applyTransformations(
    shape: Shape,
    offset: number,
    scale: number
  ): void {
    const { x: dx, y: dy } = shape.directionVector;
    const [moveX, moveY] = [dx * offset, dy * offset];

    this.ctx.translate(shape.center.x, shape.center.y);
    this.ctx.scale(scale, scale);
    this.ctx.translate(-shape.center.x + moveX, -shape.center.y + moveY);
  }

  private drawShapePath(shape: Shape): void {
    this.ctx.fillStyle = this.getShapeColor(shape.center);
    this.ctx.beginPath();

    shape.points.forEach((p, i) =>
      i === 0 ? this.ctx.moveTo(p.x, p.y) : this.ctx.lineTo(p.x, p.y)
    );

    this.ctx.closePath();
    this.ctx.fill();
  }

  private getShapeColor(center: Point): string {
    const hue = ((center.x + center.y) * 0.3) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }
}
