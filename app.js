require(["vendor/json2.js", "vendor/jquery.jsonp-2.1.4.min.js", "vendor/underscore-min.js", "vendor/backbone-min.js", "vendor/backbone-localstorage.js", "vendor/additional_functions.js"], function() {
  $(function() {
    require(["tags.js", "statuses.js"], function() {
      
      // Application
      window.AppView = Backbone.View.extend({
        el: $('#tartag'),

        events: {
          "keypress #new-tag": "createOnEnter",
          "click #delete-all": "removeAll",
          "click #refresh-all": "refreshAll"
        },

        initialize: function() {
          _.bindAll(this, 'addOne', 'addAll', 'addOneStatus', 'addAllStatuses');
          this.input = this.$("#new-tag");

          Tags.bind('add', this.addOne);
          Statuses.bind('add', this.addOneStatus);
          Tags.bind('refresh', this.addAll);
          Statuses.bind('refresh', this.addAllStatuses);

          Tags.fetch();
          Statuses.fetch();
        },

        addOne: function(tag) {
          var view = new TagView({model: tag});
          this.$('#tag-list').append(view.render().el);
        },

        addOneStatus: function(status) {
          var view = new StatusView({model:status});
          var tag_name = status.get("tag_name");
          this.$('#'+tag_name+'-statuses').prepend(view.render().el);
        },

        addAll: function() {
          Tags.each(this.addOne);
        },

        addAllStatuses: function() {
          Statuses.each(this.addOneStatus);
        },

        removeAll: function() {
          if(confirm('Usunąć wszystkie tagi?')) {
            while(!Tags.isEmpty()) {
              Tags.last().clear();
            }
          }
        },

        refreshAll: function() {
          Tags.each(function(tag) {
            tag.view.refreshTag();
          });
        },

        newAttributes: function() {
          return {
            name: this.input.val(),
            order: Tags.nextOrder(),
          };
        },

        createOnEnter: function(e) {
          if (e.keyCode != 13) return;
          Tags.create(this.newAttributes());
          this.input.val('');
        }
      });

      window.App = new AppView;

    });
  });
});
