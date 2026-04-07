import { createSlice, nanoid } from "@reduxjs/toolkit";

const initialState = {
  ideas: [
    {
      id: "1",
      title: "Upgrade digital borrowing system",
      description: "Improve library borrowing system",

      author: {
        id: "u1",
        name: "John Doe"
      },

      dept_id: "IT",

      isAnonymous: false,

      views: 12,

      upvotes: [],
      downvotes: [],

      attachments: [
        {
          id: "f1",
          name: "proposal.pdf",
          url: "/files/proposal.pdf"
        }
      ],

      comments: [],

      createdAt: new Date().toISOString()
    },

    {
      id: "2",
      title: "Upgrade Campus WiFi",
      description: "Increase bandwidth in main hall",

      author: {
        id: "u2",
        name: "Jane Smith"
      },

      dept_id: "Marketing",

      isAnonymous: false,

      views: 8,

      upvotes: [],
      downvotes: [],

      attachments: [],

      comments: [],

      createdAt: new Date().toISOString()
    }
  ]
};

const ideaSlice = createSlice({
  name: "ideas",
  initialState,

  reducers: {

    /* =========================
       ADD IDEA
    ========================= */

    addIdea: {
      reducer: (state, action) => {
        state.ideas.unshift(action.payload);
      },

      prepare: (idea) => ({
        payload: {
          id: nanoid(),
          ...idea,

          views: 0,

          upvotes: [],
          downvotes: [],

          attachments: idea.attachments || [],

          comments: [],

          createdAt: new Date().toISOString()
        }
      })
    },



    /* =========================
       INCREASE VIEW
    ========================= */

    incrementView: (state, action) => {

      const idea = state.ideas.find(
        (i) => i.id === action.payload
      );

      if (idea) {
        idea.views += 1;
      }

    },



    /* =========================
       VOTE SYSTEM
    ========================= */

    toggleVote: (state, action) => {

      const { ideaId, userId, type } = action.payload;

      const idea = state.ideas.find(
        (i) => i.id === ideaId
      );

      if (!idea) return;

      const hasUpvote = idea.upvotes.includes(userId);
      const hasDownvote = idea.downvotes.includes(userId);

      if (type === "up") {

        if (hasUpvote) {
          idea.upvotes = idea.upvotes.filter(
            (id) => id !== userId
          );
          return;
        }

        if (hasDownvote) {
          idea.downvotes = idea.downvotes.filter(
            (id) => id !== userId
          );
        }

        idea.upvotes.push(userId);

      }

      if (type === "down") {

        if (hasDownvote) {
          idea.downvotes = idea.downvotes.filter(
            (id) => id !== userId
          );
          return;
        }

        if (hasUpvote) {
          idea.upvotes = idea.upvotes.filter(
            (id) => id !== userId
          );
        }

        idea.downvotes.push(userId);

      }

    },



    /* =========================
       ADD COMMENT
    ========================= */

    addComment: (state, action) => {

      const { ideaId, comment } = action.payload;

      const idea = state.ideas.find(
        (i) => i.id === ideaId
      );

      if (!idea) return;

      idea.comments.push({
        id: nanoid(),
        ...comment,
        createdAt: new Date().toISOString()
      });

    }

  }
});

export const {
  addIdea,
  incrementView,
  toggleVote,
  addComment
} = ideaSlice.actions;

export default ideaSlice.reducer;