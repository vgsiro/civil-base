const postcard = {
  // Time labels (time_just_now kept below for backward compat)
  time_minutes_ago: 'm ago',
  time_hours_ago: 'h ago',
  time_days_ago: 'd ago',
  date_locale: 'en-AU',

  // Visibility labels
  visibility_public: 'Public',
  visibility_friends: 'Friends',
  visibility_private: 'Only me',

  // Timestamps
  time_just_now: 'Just now',

  // Post type labels
  post_type_profile_photo: 'Profile photo',
  post_type_cover_photo: 'Cover photo',
  post_type_question: 'Question',

  // Action buttons
  action_like: 'Like',
  action_liked: '♥ Liked',
  action_comment: 'Comment',
  action_recommend: 'Recommend',
  action_recommended: 'Recommended',
  action_repost: 'Repost',
  action_share: 'Share',
  share_now: 'Share now',
  share_copy_link: 'Copy link',
  share_copied: 'Copied!',
  share_via: 'Share via',
  action_reply: 'Reply',

  // Counts
  count_like: 'like',
  count_likes: 'likes',
  count_recommendation: 'recommendation',
  count_recommendations: 'recommendations',

  // Comments
  comments_empty: 'No comments yet. Be the first!',
  comments_write_placeholder: 'Write a comment…',
  comments_sort_label: 'Sort comments by',
  comments_sort_relevant: 'Most relevant',
  comments_sort_relevant_desc: 'Show the most engaging comments first.',
  comments_sort_newest: 'Newest',
  comments_sort_newest_desc: 'Show all comments with the newest first.',
  comments_all: 'All comments',
  comment_edit: 'Edit comment',
  comment_delete: 'Delete comment',

  // Post menu
  post_edit: 'Edit post',
  post_delete: 'Delete post',

  // Edit post modal
  modal_edit_post: 'Edit post',
  btn_save: 'Save',
  btn_saving: 'Saving…',
  btn_cancel: 'Cancel',

  // Delete confirm
  delete_title: 'Delete post?',
  delete_body: "This will permanently remove the post and can't be undone.",
  btn_delete: 'Delete',
  btn_deleting: 'Deleting…',

  // Recommend info modal
  recommend_title: 'Recommended by professionals',
  recommend_info: 'This is recommended by professionals. The **Recommend** button is reserved for verified professionals — it signals to the community that a post has been endorsed by a qualified expert.',
  recommend_cta: 'Submit your credentials for review to become a verified professional and unlock this feature.',
  recommend_verify_btn: 'Verify as a Professional',
  recommend_sign_in_btn: 'Sign in to verify',
  recommend_close: 'Close',
  guest_prompt_title: 'Join CivilAxis',
  guest_prompt_like: 'Sign in to like posts and show your support.',
  guest_prompt_comment: 'Sign in to leave a comment and join the discussion.',
  guest_prompt_recommend: 'Sign in to recommend posts to the community.',
  guest_prompt_share: 'Sign in to share and reshare posts.',
  guest_prompt_save: 'Sign in to save posts to your collections.',
  guest_prompt_vote: 'Sign in to vote in this poll.',
  guest_prompt_btn_signin: 'Sign in',
} as const

export default postcard
