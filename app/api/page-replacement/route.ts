import { NextResponse } from "next/server";
import type { PageReplacementInput, PageReplacementResult } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const input: PageReplacementInput = await request.json();
    const { frames, pageString, algorithm } = input;

    let result: PageReplacementResult;

    switch (algorithm) {
      case "FIFO":
        result = fifo(frames, pageString);
        break;
      case "LRU":
        result = lru(frames, pageString);
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

function fifo(numFrames: number, pages: number[]): PageReplacementResult {
  const frameStates: (number | null)[][] = [];
  const faultIndices: number[] = [];
  const frameQueue: number[] = [];

  let pageFaults = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const currentFrames: (number | null)[] = Array(numFrames).fill(null);

    if (!frameQueue.includes(page)) {
      // Page fault
      pageFaults++;
      faultIndices.push(i);

      if (frameQueue.length < numFrames) {
        frameQueue.push(page);
      } else {
        frameQueue.shift();
        frameQueue.push(page);
      }
    }

    // Copy current state
    frameQueue.forEach((p, idx) => {
      currentFrames[idx] = p;
    });

    frameStates.push(currentFrames);
  }

  const hitRatio = (pages.length - pageFaults) / pages.length;

  return {
    frameStates,
    pageFaults,
    hitRatio,
    faultIndices,
  };
}

function lru(numFrames: number, pages: number[]): PageReplacementResult {
  const frameStates: (number | null)[][] = [];
  const faultIndices: number[] = [];
  const frames: number[] = [];
  const recentUse: Map<number, number> = new Map();

  let pageFaults = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const currentFrames: (number | null)[] = Array(numFrames).fill(null);

    if (!frames.includes(page)) {
      // Page fault
      pageFaults++;
      faultIndices.push(i);

      if (frames.length < numFrames) {
        frames.push(page);
      } else {
        // Find LRU page
        let lruPage = frames[0];
        let minUse = recentUse.get(lruPage) ?? -1;

        for (const p of frames) {
          const lastUse = recentUse.get(p) ?? -1;
          if (lastUse < minUse) {
            minUse = lastUse;
            lruPage = p;
          }
        }

        const lruIndex = frames.indexOf(lruPage);
        frames[lruIndex] = page;
      }
    }

    // Update recent use
    recentUse.set(page, i);

    // Copy current state
    frames.forEach((p, idx) => {
      currentFrames[idx] = p;
    });

    frameStates.push(currentFrames);
  }

  const hitRatio = (pages.length - pageFaults) / pages.length;

  return {
    frameStates,
    pageFaults,
    hitRatio,
    faultIndices,
  };
}
