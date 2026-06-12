const postcard = {
  // Time labels (time_just_now kept below for backward compat)
  time_minutes_ago: ' phút trước',
  time_hours_ago: ' giờ trước',
  time_days_ago: ' ngày trước',
  date_locale: 'vi-VN',

  // Visibility labels
  visibility_public: 'Công khai',
  visibility_friends: 'Bạn bè',
  visibility_private: 'Chỉ mình tôi',

  // Timestamps
  time_just_now: 'Vừa xong',

  // Post type labels
  post_type_profile_photo: 'Ảnh đại diện',
  post_type_cover_photo: 'Ảnh bìa',
  post_type_question: 'Câu hỏi',

  // Action buttons
  action_like: 'Thích',
  action_liked: '♥ Đã thích',
  action_comment: 'Bình luận',
  action_recommend: 'Đề xuất',
  action_recommended: 'Đã đề xuất',
  action_repost: 'Đăng lại',
  action_share: 'Chia sẻ',
  share_now: 'Chia sẻ ngay',
  share_copy_link: 'Sao chép liên kết',
  share_copied: 'Đã sao chép!',
  share_via: 'Chia sẻ qua',
  action_reply: 'Trả lời',

  // Counts
  count_like: 'lượt thích',
  count_likes: 'lượt thích',
  count_recommendation: 'đề xuất',
  count_recommendations: 'đề xuất',

  // Comments
  comments_empty: 'Chưa có bình luận. Hãy là người đầu tiên!',
  comments_write_placeholder: 'Viết bình luận…',
  comments_sort_label: 'Sắp xếp bình luận theo',
  comments_sort_relevant: 'Liên quan nhất',
  comments_sort_relevant_desc: 'Hiển thị các bình luận hấp dẫn nhất trước.',
  comments_sort_newest: 'Mới nhất',
  comments_sort_newest_desc: 'Hiển thị tất cả bình luận, mới nhất trước.',
  comments_all: 'Tất cả bình luận',
  comment_edit: 'Chỉnh sửa bình luận',
  comment_delete: 'Xoá bình luận',

  // Post menu
  post_edit: 'Chỉnh sửa bài đăng',
  post_delete: 'Xoá bài đăng',

  // Edit post modal
  modal_edit_post: 'Chỉnh sửa bài đăng',
  btn_save: 'Lưu',
  btn_saving: 'Đang lưu…',
  btn_cancel: 'Huỷ',

  // Delete confirm
  delete_title: 'Xoá bài đăng?',
  delete_body: 'Bài đăng sẽ bị xoá vĩnh viễn và không thể khôi phục.',
  btn_delete: 'Xoá',
  btn_deleting: 'Đang xoá…',

  // Recommend info modal
  recommend_title: 'Được chuyên gia đề xuất',
  recommend_info: 'Bài đăng này được các chuyên gia đề xuất. Nút **Đề xuất** chỉ dành cho chuyên gia đã xác minh — đây là tín hiệu cho cộng đồng biết bài đăng được xác nhận bởi chuyên gia có chuyên môn.',
  recommend_cta: 'Gửi thông tin xác minh để trở thành chuyên gia đã xác minh và mở khóa tính năng này.',
  recommend_verify_btn: 'Xác minh chuyên môn',
  recommend_sign_in_btn: 'Đăng nhập để xác minh',
  recommend_close: 'Đóng',
  guest_prompt_title: 'Tham gia CivilAxis',
  guest_prompt_like: 'Đăng nhập để thích bài đăng và bày tỏ sự ủng hộ.',
  guest_prompt_comment: 'Đăng nhập để bình luận và tham gia thảo luận.',
  guest_prompt_recommend: 'Đăng nhập để đề xuất bài đăng cho cộng đồng.',
  guest_prompt_share: 'Đăng nhập để chia sẻ bài đăng.',
  guest_prompt_save: 'Đăng nhập để lưu bài đăng vào bộ sưu tập.',
  guest_prompt_vote: 'Đăng nhập để bình chọn trong cuộc thăm dò này.',
  guest_prompt_btn_signin: 'Đăng nhập',
} as const

export default postcard
