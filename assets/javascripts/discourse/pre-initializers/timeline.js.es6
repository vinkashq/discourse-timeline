import computed from 'ember-addons/ember-computed-decorators';
import TopicListItem from 'discourse/components/topic-list-item';

export default {
  name: 'timeline',
  before: 'inject-discourse-objects',
  initialize() {

    TopicListItem.reopen({

      @computed('topic', 'lastVisitedTopic')
      unboundClassNames(topic, lastVisitedTopic) {
        let classes = [];

        if (topic.get('unread_post')) {
          classes.push('unread');
        }

        if (topic.get('category')) {
          classes.push("category-" + topic.get('category.fullSlug'));
        }

        if (topic.get('hasExcerpt')) {
          classes.push('has-excerpt');
        }

        _.each(['liked', 'archived', 'bookmarked'],function(name) {
          if (topic.get(name)) {
            classes.push(name);
          }
        });

        if (topic === lastVisitedTopic) {
          classes.push('last-visit');
        }

        return classes.join(' ');
      }

    });

  }
};
