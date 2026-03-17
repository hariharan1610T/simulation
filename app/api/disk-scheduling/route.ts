import { NextResponse } from "next/server";
import type { DiskSchedulingInput, DiskSchedulingResult } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const input: DiskSchedulingInput = await request.json();
    const { requests, headPosition, algorithm, diskSize = 200, direction = "right" } = input;

    let result: DiskSchedulingResult;

    switch (algorithm) {
      case "FCFS":
        result = fcfs(requests, headPosition);
        break;
      case "SSTF":
        result = sstf(requests, headPosition);
        break;
      case "SCAN":
        result = scan(requests, headPosition, diskSize, direction);
        break;
      case "CSCAN":
        result = cscan(requests, headPosition, diskSize, direction);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid algorithm" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Simulation failed" },
      { status: 500 }
    );
  }
}

function fcfs(requests: number[], headPosition: number): DiskSchedulingResult {
  const seekSequence = [headPosition, ...requests];
  let totalHeadMovement = 0;

  for (let i = 1; i < seekSequence.length; i++) {
    totalHeadMovement += Math.abs(seekSequence[i] - seekSequence[i - 1]);
  }

  return { seekSequence, totalHeadMovement };
}

function sstf(requests: number[], headPosition: number): DiskSchedulingResult {
  const remaining = [...requests];
  const seekSequence = [headPosition];
  let currentPosition = headPosition;
  let totalHeadMovement = 0;

  while (remaining.length > 0) {
    // Find nearest request
    let minDistance = Infinity;
    let nearestIndex = 0;

    for (let i = 0; i < remaining.length; i++) {
      const distance = Math.abs(remaining[i] - currentPosition);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    const nextPosition = remaining[nearestIndex];
    totalHeadMovement += Math.abs(nextPosition - currentPosition);
    seekSequence.push(nextPosition);
    currentPosition = nextPosition;
    remaining.splice(nearestIndex, 1);
  }

  return { seekSequence, totalHeadMovement };
}

function scan(
  requests: number[],
  headPosition: number,
  diskSize: number,
  direction: "left" | "right"
): DiskSchedulingResult {
  const sorted = [...requests].sort((a, b) => a - b);
  const seekSequence = [headPosition];
  let totalHeadMovement = 0;
  let currentPosition = headPosition;

  const left = sorted.filter((r) => r < headPosition);
  const right = sorted.filter((r) => r >= headPosition);

  if (direction === "right") {
    // Move right first
    for (const pos of right) {
      totalHeadMovement += Math.abs(pos - currentPosition);
      seekSequence.push(pos);
      currentPosition = pos;
    }

    // Go to end if needed
    if (left.length > 0) {
      totalHeadMovement += Math.abs(diskSize - 1 - currentPosition);
      seekSequence.push(diskSize - 1);
      currentPosition = diskSize - 1;

      // Move left
      for (let i = left.length - 1; i >= 0; i--) {
        totalHeadMovement += Math.abs(left[i] - currentPosition);
        seekSequence.push(left[i]);
        currentPosition = left[i];
      }
    }
  } else {
    // Move left first
    for (let i = left.length - 1; i >= 0; i--) {
      totalHeadMovement += Math.abs(left[i] - currentPosition);
      seekSequence.push(left[i]);
      currentPosition = left[i];
    }

    // Go to start if needed
    if (right.length > 0) {
      totalHeadMovement += Math.abs(0 - currentPosition);
      seekSequence.push(0);
      currentPosition = 0;

      // Move right
      for (const pos of right) {
        totalHeadMovement += Math.abs(pos - currentPosition);
        seekSequence.push(pos);
        currentPosition = pos;
      }
    }
  }

  return { seekSequence, totalHeadMovement };
}

function cscan(
  requests: number[],
  headPosition: number,
  diskSize: number,
  direction: "left" | "right"
): DiskSchedulingResult {
  const sorted = [...requests].sort((a, b) => a - b);
  const seekSequence = [headPosition];
  let totalHeadMovement = 0;
  let currentPosition = headPosition;

  const left = sorted.filter((r) => r < headPosition);
  const right = sorted.filter((r) => r >= headPosition);

  if (direction === "right") {
    // Move right first
    for (const pos of right) {
      totalHeadMovement += Math.abs(pos - currentPosition);
      seekSequence.push(pos);
      currentPosition = pos;
    }

    if (left.length > 0) {
      // Go to end
      totalHeadMovement += Math.abs(diskSize - 1 - currentPosition);
      seekSequence.push(diskSize - 1);

      // Jump to start (counted as movement in C-SCAN)
      totalHeadMovement += diskSize - 1;
      seekSequence.push(0);
      currentPosition = 0;

      // Continue from start
      for (const pos of left) {
        totalHeadMovement += Math.abs(pos - currentPosition);
        seekSequence.push(pos);
        currentPosition = pos;
      }
    }
  } else {
    // Move left first
    for (let i = left.length - 1; i >= 0; i--) {
      totalHeadMovement += Math.abs(left[i] - currentPosition);
      seekSequence.push(left[i]);
      currentPosition = left[i];
    }

    if (right.length > 0) {
      // Go to start
      totalHeadMovement += Math.abs(0 - currentPosition);
      seekSequence.push(0);

      // Jump to end
      totalHeadMovement += diskSize - 1;
      seekSequence.push(diskSize - 1);
      currentPosition = diskSize - 1;

      // Continue from end
      for (let i = right.length - 1; i >= 0; i--) {
        totalHeadMovement += Math.abs(right[i] - currentPosition);
        seekSequence.push(right[i]);
        currentPosition = right[i];
      }
    }
  }

  return { seekSequence, totalHeadMovement };
}
