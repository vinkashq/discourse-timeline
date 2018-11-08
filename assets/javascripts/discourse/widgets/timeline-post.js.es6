import { avatarImg, avatarFor } from 'discourse/widgets/post';
import PostCooked from 'discourse/widgets/post-cooked';
import DecoratorHelper from 'discourse/widgets/decorator-helper';
import { createWidget, applyDecorators } from 'discourse/widgets/widget';
import { iconNode } from 'discourse/helpers/fa-icon-node';
import { transformBasicPost } from 'discourse/lib/transform-post';
import { h } from 'virtual-dom';
import DiscourseURL from 'discourse/lib/url';
import { dateNode } from 'discourse/helpers/node';
import { translateSize, avatarUrl } from 'discourse/lib/utilities';

createWidget('timeline-post-avatar', {
  tagName: 'div.topic-avatar',

  settings: {
    size: 'large'
  },

  html(attrs) {
    let body;
    if (!attrs.user_id) {
      body = iconNode('trash', { class: 'deleted-user-avatar'} );
    } else {
      body = avatarFor.call(this, this.settings.size, {
        template: attrs.avatar_template,
        username: attrs.username,
        url: attrs.usernameUrl,
        className: 'main-avatar'
      });
    }

    const result = [body];

    if (attrs.primary_group_flair_url || attrs.primary_group_flair_bg_color) {
      result.push(this.attach('avatar-flair', attrs));
    }

    result.push(h('div.poster-avatar-extra'));

    return result;
  }
});

createWidget('timeline-post-meta-data', {
  tagName: 'div.topic-meta-data',
  html(attrs) {
    const result = [this.attach('poster-name', attrs)];

    if (attrs.isWhisper) {
      result.push(h('div.post-info.whisper', {
        attributes: { title: I18n.t('post.whisper') },
      }, iconNode('eye-slash')));
    }

    const createdAt = new Date(attrs.created_at);
    if (createdAt) {
      result.push(h('div.post-info',
        h('a.post-date', {
          attributes: {
            href: attrs.shareUrl,
            'data-share-url': attrs.shareUrl,
            'data-post-number': attrs.post_number,
          }
        }, dateNode(createdAt))
      ));
    }

    return result;
  }
});

createWidget('timeline-post-contents', {
  buildKey: attrs => `post-contents-${attrs.id}`,

  buildClasses(attrs) {
    const classes = ['regular'];
    if (!this.state.repliesShown) {
      classes.push('contents');
    }
    return classes;
  },

  html(attrs, state) {
    let result = [new PostCooked(attrs, new DecoratorHelper(this))];
    result = result.concat(applyDecorators(this, 'after-cooked', attrs, state));

    return result;
  }
});

createWidget('timeline-post-body', {
  tagName: 'div.topic-body.clearfix',

  html(attrs) {
    const result = [];

    if (attrs.post_number > 1) {
      result.push(this.attach('timeline-post-meta-data', attrs));
    }

    result.push(this.attach('timeline-post-contents', attrs));

    result.push(this.attach('actions-summary', attrs));
    result.push(this.attach('post-links', attrs));
    if (attrs.showTopicMap) {
      result.push(this.attach('topic-map', attrs));
    }

    return result;
  }
});

createWidget('timeline-post-article', {
  tagName: 'article.boxed.onscreen-post',
  buildKey: attrs => `post-article-${attrs.id}`,

  defaultState() {
    return { repliesAbove: [] };
  },

  buildId(attrs) {
    return `post_${attrs.post_number}`;
  },

  buildClasses(attrs) {
    let classNames = [];
    if (attrs.via_email) { classNames.push('via-email'); }
    if (attrs.isAutoGenerated) { classNames.push('is-auto-generated'); }
    return classNames;
  },

  buildAttributes(attrs) {
    return { 'data-post-id': attrs.id, 'data-user-id': attrs.user_id };
  },

  html(attrs, state) {
    const rows = [h('a.tabLoc', { attributes: { href: ''} })];

    if (attrs.post_number == 1) {
      rows.push(this.attach('timeline-post-body', attrs));
    } else {
      rows.push(h('div.row', [this.attach('timeline-post-avatar', attrs), this.attach('timeline-post-body', attrs)]));
    }
    return rows;
  },

  _getTopicUrl() {
    const post = this.findAncestorModel();
    return post ? post.get('topic.url') : null;
  }

});

let addPostClassesCallbacks = null;
export function addPostClassesCallback(callback) {
  addPostClassesCallbacks = addPostClassesCallbacks || [];
  addPostClassesCallbacks.push(callback);
}

export default createWidget('timeline-post', {
  buildKey: attrs => `post-${attrs.id}`,
  shadowTree: true,

  buildAttributes(attrs) {
    return attrs.height ? { style: `min-height: ${attrs.height}px` } : undefined;
  },

  buildId(attrs) {
    return attrs.cloaked ? `post_${attrs.post_number}` : undefined;
  },

  buildClasses(attrs) {
    if (attrs.cloaked) { return 'cloaked-post'; }
    const classNames = ['topic-post', 'clearfix'];

    if (attrs.id === -1 || attrs.isSaving) { classNames.push('staged'); }
    if (attrs.selected) { classNames.push('selected'); }
    if (attrs.topicOwner) { classNames.push('topic-owner'); }
    if (attrs.hidden) { classNames.push('post-hidden'); }
    if (attrs.deleted) { classNames.push('deleted'); }
    if (attrs.primary_group_name) { classNames.push(`group-${attrs.primary_group_name}`); }
    if (attrs.wiki) { classNames.push(`wiki`); }
    if (attrs.isWhisper) { classNames.push('whisper'); }
    if (attrs.isModeratorAction || (attrs.isWarning && attrs.firstPost)) {
      classNames.push('moderator');
    } else {
      classNames.push('regular');
    }
    if (addPostClassesCallbacks) {
      for(let i=0; i<addPostClassesCallbacks.length; i++) {
        let pluginClasses = addPostClassesCallbacks[i].call(this, attrs);
        if (pluginClasses) {
          classNames.push.apply(classNames, pluginClasses);
        }
      }
    }
    return classNames;
  },

  html(attrs) {
    if (attrs.cloaked) { return ''; }

    return this.attach('timeline-post-article', attrs);
  }
});
