import { NextResponse } from "next/server";
import type { BankerInput, BankerResult } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const input: BankerInput = await request.json();
    const { processes, resources, allocation, max, available } = input;

    // Calculate Need matrix
    const need: number[][] = [];
    for (let i = 0; i < processes; i++) {
      need[i] = [];
      for (let j = 0; j < resources; j++) {
        need[i][j] = (max[i]?.[j] ?? 0) - (allocation[i]?.[j] ?? 0);
      }
    }

    // Safety algorithm
    const work = [...available];
    const finish = Array(processes).fill(false);
    const safeSequence: number[] = [];

    let count = 0;
    while (count < processes) {
      let found = false;

      for (let i = 0; i < processes; i++) {
        if (!finish[i]) {
          // Check if Need[i] <= Work
          let canAllocate = true;
          for (let j = 0; j < resources; j++) {
            if (need[i][j] > work[j]) {
              canAllocate = false;
              break;
            }
          }

          if (canAllocate) {
            // Simulate allocation
            for (let j = 0; j < resources; j++) {
              work[j] += allocation[i]?.[j] ?? 0;
            }
            safeSequence.push(i);
            finish[i] = true;
            found = true;
            count++;
          }
        }
      }

      if (!found) {
        break;
      }
    }

    const safe = count === processes;

    const result: BankerResult = {
      safe,
      safeSequence: safe ? safeSequence : [],
      need,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Simulation failed" },
      { status: 500 }
    );
  }
}
