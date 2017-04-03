# name: timeline
# about: Social network news feed like UI in topic list.
# version: 0.0.1
# authors: Vinoth Kannan (vinothkannan@vinkas.com)
# url: https://github.com/VinkasHQ/discourse-timeline

register_asset "stylesheets/timeline.scss"

after_initialize do

  TopicListItemSerializer.class_eval do

    has_one :unread_post, serializer: PostSerializer, embed: :objects

    def unread_post
      return object.first_post unless last_read_post_number

      return nil if last_read_post_number == object.highest_post_number

      object.posts.find_by(post_number: last_read_post_number + 1)
    end

  end

end
