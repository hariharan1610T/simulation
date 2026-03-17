import { NextResponse } from "next/server";
import type { FileAllocationState, FileBlock } from "@/lib/types";

// Helper to create initial state
function makeState(totalBlocks: number): FileAllocationState {
  return {
    files: [],
    diskBlocks: Array(totalBlocks).fill(null),
    totalBlocks: totalBlocks,
  };
}

// Helper to find contiguous blocks
function findContiguousSpace(diskBlocks: (string | null)[], size: number): number {
  let consecutive = 0;
  let start = -1;

  for (let i = 0; i < diskBlocks.length; i++) {
    if (diskBlocks[i] === null) {
      if (consecutive === 0) start = i;
      consecutive++;
      if (consecutive >= size) return start;
    } else {
      consecutive = 0;
      start = -1;
    }
  }
  return -1;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || "initialize";

    if (action === "initialize") {
      const totalBlocks = parseInt(body.totalBlocks) || 50;
      if (totalBlocks < 5 || totalBlocks > 500) {
        return NextResponse.json(
          { error: "Total blocks must be between 5 and 500" },
          { status: 400 }
        );
      }
      return NextResponse.json({ state: makeState(totalBlocks) });
    }

    if (action === "create") {
      const state = body.state as FileAllocationState;
      const fileName = body.fileName;
      const fileSize = parseInt(body.fileSize);

      if (!fileName || fileSize <= 0) {
        return NextResponse.json(
          { error: "Invalid file name or size" },
          { status: 400 }
        );
      }

      // Check duplicate name
      if (state.files.some((f) => f.name === fileName)) {
        return NextResponse.json(
          { error: "File with this name already exists" },
          { status: 400 }
        );
      }

      const startBlock = findContiguousSpace(state.diskBlocks, fileSize);
      if (startBlock === -1) {
        return NextResponse.json(
          { error: "Not enough contiguous space available" },
          { status: 400 }
        );
      }

      const newFile: FileBlock = {
        id: Math.random().toString(36).substring(7),
        name: fileName,
        startBlock,
        length: fileSize,
        blocks: Array.from({ length: fileSize }, (_, i) => startBlock + i),
      };

      const newDiskBlocks = [...state.diskBlocks];
      for (let i = 0; i < fileSize; i++) {
        newDiskBlocks[startBlock + i] = newFile.id;
      }

      const newState: FileAllocationState = {
        ...state,
        files: [...state.files, newFile],
        diskBlocks: newDiskBlocks,
      };

      return NextResponse.json({ state: newState });
    }

    if (action === "delete") {
      const state = body.state as FileAllocationState;
      const fileId = body.fileId;

      const fileIndex = state.files.findIndex((f) => f.id === fileId);
      if (fileIndex === -1) {
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }

      const file = state.files[fileIndex];
      const newDiskBlocks = [...state.diskBlocks];
      
      // Clear blocks
      for (const blockIndex of file.blocks) {
        if (blockIndex >= 0 && blockIndex < newDiskBlocks.length) {
          newDiskBlocks[blockIndex] = null;
        }
      }

      const newFiles = state.files.filter((f) => f.id !== fileId);

      const newState: FileAllocationState = {
        ...state,
        files: newFiles,
        diskBlocks: newDiskBlocks,
      };

      return NextResponse.json({ state: newState });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
