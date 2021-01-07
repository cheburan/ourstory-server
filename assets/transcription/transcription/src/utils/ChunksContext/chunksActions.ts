// External Dependencies
import { v4 as uuidv4 } from "uuid";

// Internal Dependencies
import adjacentMap from "../adjacentMap";
import {
  getEnclosingChunk,
  getLastEndTimeSeconds,
  getLastEndTimeStamp,
  invalidSplit,
  toTimeStamp,
} from "../chunkManipulation";
import oneSatisfies from "../oneSatisfies";
import { Chunk, Review, Transcription } from "../types";
import chunksContext from "./chunksContext";

/**
 * Using the ChunksContext, get a function for deleting chunks
 */
export const useDeleteChunk = () => {
  const [, setChunks] = chunksContext.useChunksState();

  /**
   * Delete a chunk from the chunks in the ChunksContext
   *
   * @param toDelete - the chunk to delete
   */
  return (toDelete: Chunk) =>
    setChunks((chunks) =>
      /*
      This call to adjacentMap is checking that if, after deleting the chunk
      (which is done with a call to filter), there is a gap in the chunks.
      If so, we need to create a new chunk that closes the gap

      At a high level:
      If we have chunks A B C D, and we delete chunk B we now have a gap
      between chunks A and C. To fix this, we need to create a new chunk
      that has the same start time as A and the same end time as C,
      so we end up with: E D, where E is a new chunk that we create in this
      calle to adjacentMap
      */
      adjacentMap(
        chunks.filter((c) => c.id !== toDelete.id),
        (a: Chunk, b: Chunk) => {
          if (a.endtimeseconds !== b.starttimeseconds) {
            return {
              ...b,
              starttimeseconds: a.endtimeseconds,
              starttimestamp: a.endtimestamp,
              id: uuidv4(),
              updatedat: new Date(),
              transcriptions: [],
            };
          }
          return b;
        }
      )
        .concat(
          ((first) =>
            first
              ? first.starttimeseconds === 0
                ? [first]
                : [
                    {
                      ...first,
                      starttimeseconds: 0,
                      starttimestamp: "00:00:00:00",
                      id: uuidv4(),
                      updatedat: new Date(),
                      transcriptions: [],
                    },
                  ]
              : [])(chunks.filter((c) => c.id !== toDelete.id)[0])
        )
        .sort((a, b) => a.endtimeseconds - b.endtimeseconds)
    );
};

/**
 * Using the ChunksContext, get a function for creating new chunks
 */
export const useNewChunk = () => {
  const [chunks, setChunks] = chunksContext.useChunksState();

  /**
   * This function creates a new chunk in the video.
   * Invalid chunks are defined by the invalidSplit function and will not be created
   *
   * @param splitAt - the point in the video (as a fraction) where the new chunk should end
   * @param storyDuration - the length of the video being chunked
   * @param userName - the name of the user doing the chunking
   */
  return (splitAt: number, storyDuration: number, userName: string) => {
    if (invalidSplit(chunks, splitAt, storyDuration)) {
      return;
    }
    const enclosingChunk = getEnclosingChunk(chunks, splitAt);
    if (enclosingChunk != null) {
      setChunks((chunks) =>
        chunks
          .filter((c) => c.id !== enclosingChunk.id)
          .concat([
            {
              starttimestamp: enclosingChunk.starttimestamp,
              starttimeseconds: enclosingChunk.starttimeseconds,
              endtimestamp: toTimeStamp(splitAt * storyDuration),
              endtimeseconds: splitAt,
              creatorid: userName,
              updatedat: new Date(),
              id: uuidv4(),
              transcriptions: [],
            },
            {
              starttimestamp: toTimeStamp(splitAt * storyDuration),
              starttimeseconds: splitAt,
              endtimestamp: enclosingChunk.endtimestamp,
              endtimeseconds: enclosingChunk.endtimeseconds,
              creatorid: userName,
              updatedat: new Date(),
              id: uuidv4(),
              transcriptions: [],
            },
          ])
          .sort((a, b) => a.endtimeseconds - b.endtimeseconds)
      );
    } else {
      setChunks(
        chunks.concat([
          {
            starttimestamp: getLastEndTimeStamp(chunks),
            endtimestamp: toTimeStamp(splitAt * storyDuration),
            starttimeseconds: getLastEndTimeSeconds(chunks),
            endtimeseconds: splitAt,
            creatorid: userName,
            updatedat: new Date(),
            id: uuidv4(),
            transcriptions: [],
          },
        ])
      );
    }
  };
};

/**
 * Using the ChunksContext, get a function for updating a chunks transcription
 * list
 */
export const useUpdateTranscription = () => {
  const [, setChunks] = chunksContext.useChunksState();

  return (toUpdate: Chunk, updatedTranscription: string, userName: string) => {
    setChunks((chunks) =>
      chunks.map((chunk) =>
        chunk.id === toUpdate.id
          ? {
              ...chunk,
              /* This call to oneSatisfies checks if the current user has
               * already made a transcription for this chunk (in that case,
               * update that chunk instead of creating a new one)
               */
              transcriptions: oneSatisfies(
                chunk.transcriptions,
                (t) => t.creatorid === userName
              )
                ? chunk.transcriptions.map((t) =>
                    t.creatorid === userName
                      ? { ...t, content: updatedTranscription }
                      : t
                  )
                : chunk.transcriptions.concat([
                    {
                      creatorid: userName,
                      content: updatedTranscription,
                      id: uuidv4(),
                      updatedat: new Date(),
                    },
                  ]),
            }
          : chunk
      )
    );
  };
};

/**
 * Using the ChunksContext, get a function for updating the Review of a Chunk
 */
export const useUpdateReview = () => {
  const [, setChunks] = chunksContext.useChunksState();

  return (
    toUpdate: Chunk,
    selectedTranscription: Transcription,
    userName: string
  ) => {
    setChunks((chunks) =>
      chunks.map((chunk) =>
        chunk.id === toUpdate.id
        /*
         * This call to oneSatisfies simply checks if the
         * selectedTranscription exists on the Chunk
         * (if it doesn't, don't update the chunk)
         */
          ? oneSatisfies(
              chunk.transcriptions,
              (a) => a.id === selectedTranscription.id
            )
            ? {
                ...chunk,
                review: {
                  reviewedat: new Date(),
                  selectedtranscription: selectedTranscription.id,
                  reviewedby: userName,
                },
              }
            : chunk
          : chunk
      )
    );
  };
};
