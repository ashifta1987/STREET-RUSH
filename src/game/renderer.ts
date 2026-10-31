import { CityConfig } from './content';
import { RacerBody } from './physics';
import { GhostSample } from './race';
import { RoadsideProp, TrackData } from './tracks/types';

export interface SkidMark {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
}

export interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export class RaceRenderer {
  private cameraX = 0;
  private cameraY = 0;
  private cameraAngle = 0;
  private initializedCamera = false;

  resetCamera(player: RacerBody) {
    this.cameraX = player.x;
    this.cameraY = player.y;
    this.cameraAngle = player.angle;
    this.initializedCamera = true;
  }

  render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    track: TrackData,
    city: CityConfig,
    racers: RacerBody[],
    player: RacerBody,
    skidMarks: SkidMark[],
    particles: SparkParticle[],
    ghostPose: GhostSample | null
  ) {
    if (!this.initializedCamera) {
      this.resetCamera(player);
    }

    // Smooth camera follow & rotation with player car (car points UP on screen)
    const lookAhead = Math.min(95, Math.max(0, player.speed * 0.22));
    const targetX = player.x + Math.cos(player.angle) * lookAhead;
    const targetY = player.y + Math.sin(player.angle) * lookAhead;

    this.cameraX += (targetX - this.cameraX) * 0.18;
    this.cameraY += (targetY - this.cameraY) * 0.18;

    let dAngle = player.angle - this.cameraAngle;
    while (dAngle > Math.PI) dAngle -= Math.PI * 2;
    while (dAngle < -Math.PI) dAngle += Math.PI * 2;
    this.cameraAngle += dAngle * 0.14;

    ctx.save();

    // 1. Background ground fill
    ctx.fillStyle = city.groundColor;
    ctx.fillRect(0, 0, width, height);

    // Transform world -> screen so player is at (width/2, height*0.64) facing UP (-PI/2)
    ctx.translate(width * 0.5, height * 0.64);
    ctx.rotate(-this.cameraAngle - Math.PI / 2);
    ctx.translate(-this.cameraX, -this.cameraY);

    // 2. World grid / terrain texture lines within camera view radius
    this.drawWorldGroundPattern(ctx, city);

    // 3. Draw Track Layers (Outer Barrier Wall -> Off-road Shoulder -> Curbs -> Asphalt -> Center Line -> Checkered Start)
    this.drawTrackSurface(ctx, track, city);

    // 4. Draw Skid Marks
    if (skidMarks.length > 0) {
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (const s of skidMarks) {
        ctx.strokeStyle = `rgba(10, 12, 16, ${s.alpha * 0.55})`;
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
      }
    }

    // 5. Draw Ghost Car (if available)
    if (ghostPose) {
      this.drawGhostCar(ctx, ghostPose);
    }

    // 6. Draw all 5 Racers (sorted so player is drawn on top)
    const sortedForDraw = [...racers].sort((a, b) =>
      a.isPlayer === b.isPlayer ? 0 : a.isPlayer ? 1 : -1
    );
    for (const r of sortedForDraw) {
      this.drawCar(ctx, r, this.cameraAngle);
    }

    // 7. Draw Spark / Drift Particles
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 8. Draw Roadside Scenery Props (Trees, Neon signs, Towers, Palms, Buildings)
    this.drawRoadsideProps(ctx, track.props, city);

    ctx.restore();
  }

  private drawWorldGroundPattern(ctx: CanvasRenderingContext2D, city: CityConfig) {
    const viewRadius = 1100;
    const step = 160;
    const startX = Math.floor((this.cameraX - viewRadius) / step) * step;
    const endX = this.cameraX + viewRadius;
    const startY = Math.floor((this.cameraY - viewRadius) / step) * step;
    const endY = this.cameraY + viewRadius;

    ctx.strokeStyle = city.groundPatternColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += step) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += step) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  }

  private drawTrackSurface(
    ctx: CanvasRenderingContext2D,
    track: TrackData,
    city: CityConfig
  ) {
    const pts = track.spline;
    if (pts.length === 0) return;

    const traceClosedPath = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.closePath();
    };

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Outer barrier wall border
    traceClosedPath();
    ctx.strokeStyle = city.wallColor;
    ctx.lineWidth = track.wallOffset * 2 + 24;
    ctx.stroke();

    // High-contrast barrier stripe trim
    traceClosedPath();
    ctx.strokeStyle = city.accentColor;
    ctx.lineWidth = track.wallOffset * 2 + 6;
    ctx.stroke();

    // Off-road shoulder (grass / sand / urban runoff) between road and wall
    traceClosedPath();
    ctx.strokeStyle = city.roadShoulderColor;
    ctx.lineWidth = track.wallOffset * 2 - 4;
    ctx.stroke();

    // Curbs (alternating A / B colours)
    traceClosedPath();
    ctx.strokeStyle = city.curbColorA;
    ctx.lineWidth = track.roadWidth + 22;
    ctx.stroke();

    ctx.save();
    ctx.setLineDash([28, 28]);
    traceClosedPath();
    ctx.strokeStyle = city.curbColorB;
    ctx.lineWidth = track.roadWidth + 22;
    ctx.stroke();
    ctx.restore();

    // Main asphalt road surface
    traceClosedPath();
    ctx.strokeStyle = city.roadColor;
    ctx.lineWidth = track.roadWidth;
    ctx.stroke();

    // Subtle racing groove / inner lane lines
    ctx.save();
    ctx.setLineDash([36, 44]);
    traceClosedPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Checkered Start / Finish Line at Checkpoint 0
    const startCp = track.checkpoints[0];
    if (startCp) {
      ctx.save();
      ctx.translate(startCp.x, startCp.y);
      ctx.rotate(Math.atan2(startCp.ty, startCp.tx));

      const halfW = track.roadWidth * 0.5;
      const rows = 2;
      const cols = 12;
      const cellW = 12;
      const cellH = (halfW * 2) / cols;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#0f172a';
          ctx.fillRect(
            -rows * cellW * 0.5 + r * cellW,
            -halfW + c * cellH,
            cellW,
            cellH
          );
        }
      }

      // Start arch banner across road
      ctx.fillStyle = city.accentColor;
      ctx.fillRect(-16, -halfW - 14, 32, 12);
      ctx.fillRect(-16, halfW + 2, 32, 12);
      ctx.restore();
    }
  }

  private drawGhostCar(ctx: CanvasRenderingContext2D, ghost: GhostSample) {
    ctx.save();
    ctx.translate(ghost.x, ghost.y);
    ctx.rotate(ghost.angle);
    ctx.globalAlpha = 0.38;

    ctx.fillStyle = '#00f0ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-22, -12, 44, 24, 6);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private drawCar(
    ctx: CanvasRenderingContext2D,
    racer: RacerBody,
    cameraAngle: number
  ) {
    // Cull if far outside view
    if (Math.hypot(racer.x - this.cameraX, racer.y - this.cameraY) > 1250) {
      return;
    }

    ctx.save();
    ctx.translate(racer.x, racer.y);

    // Draw car body rotated by heading
    ctx.save();
    ctx.rotate(racer.angle);

    // Soft drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.beginPath();
    ctx.roundRect(-24, -14, 48, 28, 7);
    ctx.fill();

    // 4 Wheels
    ctx.fillStyle = '#090b10';
    // Rear wheels
    ctx.fillRect(-18, -15, 10, 4);
    ctx.fillRect(-18, 11, 10, 4);
    // Front steerable wheels
    ctx.save();
    ctx.translate(12, -13);
    ctx.rotate(racer.steerAngle);
    ctx.fillRect(-5, -2, 10, 4);
    ctx.restore();

    ctx.save();
    ctx.translate(12, 13);
    ctx.rotate(racer.steerAngle);
    ctx.fillRect(-5, -2, 10, 4);
    ctx.restore();

    // Main Chassis
    ctx.fillStyle = racer.color;
    ctx.strokeStyle = racer.isPlayer ? '#ffffff' : '#0f172a';
    ctx.lineWidth = racer.isPlayer ? 2 : 1.5;
    ctx.beginPath();
    ctx.roundRect(-22, -12, 44, 24, 6);
    ctx.fill();
    ctx.stroke();

    // Racing Center Stripe
    ctx.fillStyle = racer.stripeColor;
    ctx.fillRect(-20, -2.5, 40, 5);

    // Cabin / Windshield
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-8, -9, 20, 18, 4);
    ctx.fill();

    // Rear Spoiler
    ctx.fillStyle = '#111827';
    ctx.fillRect(-23, -11, 4, 22);

    // Headlight beams
    ctx.fillStyle = 'rgba(254, 249, 195, 0.85)';
    ctx.fillRect(20, -9, 3, 4);
    ctx.fillRect(20, 5, 3, 4);

    // Brake taillights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-22, -9, 2, 4);
    ctx.fillRect(-22, 5, 2, 4);

    ctx.restore();

    // Floating driver tag upright relative to screen camera
    ctx.save();
    ctx.rotate(cameraAngle + Math.PI / 2);
    ctx.font = 'bold 11px "Inter", sans-serif';
    ctx.textAlign = 'center';
    const label = racer.isPlayer ? `P${racer.position} · YOU` : `P${racer.position} · ${racer.name}`;
    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = racer.isPlayer ? 'rgba(255, 51, 102, 0.9)' : 'rgba(15, 23, 42, 0.82)';
    ctx.beginPath();
    ctx.roundRect(-textWidth * 0.5 - 6, -36, textWidth + 12, 16, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, 0, -24);
    ctx.restore();

    ctx.restore();
  }

  private drawRoadsideProps(
    ctx: CanvasRenderingContext2D,
    props: RoadsideProp[],
    city: CityConfig
  ) {
    for (const p of props) {
      if (Math.hypot(p.x - this.cameraX, p.y - this.cameraY) > 1050) continue;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(p.scale, p.scale);
      ctx.rotate(p.rotation);

      if (city.sceneryType === 'palms') {
        // Kochi Coconut Palm & Backwater foliage
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.arc(4, 4, 24, 0, Math.PI * 2);
        ctx.fill();

        for (let f = 0; f < 6; f++) {
          ctx.save();
          ctx.rotate((f * Math.PI) / 3);
          ctx.fillStyle = f % 2 === 0 ? '#10b981' : '#059669';
          ctx.beginPath();
          ctx.ellipse(12, 0, 14, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (city.sceneryType === 'seawall') {
        // Mumbai Marine Drive promenade towers & warm golden lamps
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-18, -18, 36, 36, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (city.sceneryType === 'towers') {
        // Dubai glass towers & golden desert palms
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
      } else if (city.sceneryType === 'neon') {
        // Tokyo cyberpunk neon blocks
        ctx.fillStyle = '#1e1b4b';
        ctx.strokeStyle = p.variant % 2 === 0 ? '#ec4899' : '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.fillRect(-20, -14, 40, 28);
        ctx.strokeRect(-20, -14, 40, 28);

        ctx.fillStyle = p.variant % 2 === 0 ? '#f472b6' : '#67e8f9';
        ctx.fillRect(-12, -4, 24, 8);
      } else {
        // New York downtown buildings & yellow/red rooftop lights
        ctx.fillStyle = '#1f2937';
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 2;
        ctx.fillRect(-22, -22, 44, 44);
        ctx.strokeRect(-22, -22, 44, 44);

        ctx.fillStyle = p.variant % 2 === 0 ? '#ef4444' : '#facc15';
        ctx.fillRect(-8, -8, 16, 16);
      }

      ctx.restore();
    }
  }
}
