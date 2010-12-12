$(function(){

  // Model
  window.Tag = Backbone.Model.extend({
  
  validate: function(attrs) {
    if(!attrs.name.match(/^[a-z0-9]+$/)) {
      return "Nazwa tagu jest niepoprawna."
    }

    if(_.include(Tags.pluck("name"), attrs.name)) {
      return "Podany tag już istnieje."
    }
  },

  initialize: function() {
    _.bindAll(this, "error", "add");

    this.bind("error", this.display_error);
    this.bind("add", this.fetch_statuses);

  },

  display_error: function(model, error) {
    this.destroy();
    alert(error);
  },

  statuses: function() {
    var tag = this;
    var statuses = Statuses.filter(function(status) {
      return status.get("tag_name") == tag.get("name");
    });
    return statuses;
  },

  clear: function() {
    _.each(this.statuses(), function(status) {
      status.clear();
    });
    this.destroy();
    this.view.remove();
  },

  fetch_statuses: function() {
    var tag = this;
    $.jsonp({
      url: 'http://api.blip.pl/tags/'+this.get("name")+'.json?include=pictures&callback=?',
      error: function(error, error_msg) {
        alert('Błąd połączenia z Blipem. Być może taki tag nie istnieje?');
      },
      success: function(json, text_status) {
        _.each(json, function(status){
          Statuses.create({
            body: status.body,
            blip_id: status.id,
            created_at: status.created_at,
            user: status.user_path.replace('/users/', ''),
            order: Statuses.nextOrder(),
            tag_name: tag.get("name")
          });
        });
      }
    });
  }

  });

  window.Status = Backbone.Model.extend({
    clear: function() {
      this.destroy();
      this.view.remove();
    }
  });

  // Collection
  window.TagList = Backbone.Collection.extend({
    model: Tag,
    localStorage: new Store("tags"),

    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    comparator: function(tag) {
      return tag.get("order");
    }
  });

  window.StatusList = Backbone.Collection.extend({
    model: Status,
    localStorage: new Store("statuses"),

    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    comparator: function(status) {
      return status.get("order");
    }
  });

  // Global collection
  window.Tags = new TagList;
  window.Statuses = new StatusList;

  // Tag item view
  window.TagView = Backbone.View.extend({
    tagName: "li",
    className: "tag",

    template: _.template($('#tag-template').html()),

    events: {
      "click span.tag-destroy": "clear",
      "click span.tag-toggle": "toggleList"
    },

    initialize: function() {
      //_.bindAll(this, 'render');
      this.model.view = this;
    },

    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      $(this.el).fadeIn();
      this.setContent();
      return this;
    },

    setContent: function() {
      var name = this.model.get("name");
      this.$('.tag-name').text(name);
      this.$('.statuses-list').attr('id', this.model.get("name")+'-statuses');
      //this.input = this.$('.tag-input');
      //this.input.bind('blur', this.close);
      //this.input.val(name);
    },

    remove: function() {
      $(this.el).fadeOut();
    },

    clear: function() {
      this.model.clear();
    },

    toggleList: function() {
      this.$('.statuses-list').slideToggle();
    }
  });

  window.StatusView = Backbone.View.extend({
    tagName: "li",
    className: "status",

    template: _.template($('#status-template').html()),

    initialize: function() {
      this.model.view = this;
    },

    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      //$(this.el).fadeIn();
      this.setContent();
      return this;
    },

    setContent: function() {
      this.$('.status-body').text(this.model.get("body"));
      this.$('.status-user a').text('^' + this.model.get("user"));
      this.$('.status-user a').attr('href', 'http://blip.pl/users/'+this.model.get("user")+'/dashboard');
      var status_id = this.model.get("blip_id");
      this.$('.status-link').html('<a href="http://blip.pl/s/'+status_id+'">[idź do statusu]</a>');
    },

    remove: function() {
      $(this.el).fadeOut();
    }
  });

  // Application
  window.AppView = Backbone.View.extend({
    el: $('#tartag'),

    events: {
      "keypress #new-tag": "createOnEnter",
      "click #delete-all": "removeAll"
    },

    initialize: function() {
      _.bindAll(this, 'addOne', 'addAll', 'addOneStatus', 'addAllStatuses');
      this.input = this.$("#new-tag");

      Tags.bind('add', this.addOne);
      Statuses.bind('add', this.addOneStatus);
      //Tags.bind('refresh', this.addAll);
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
      this.$('#'+tag_name+'-statuses').append(view.render().el);
    },

    addAll: function() {
      Tags.each(this.addOne);
    },

    addAllStatuses: function() {
      Statuses.each(this.addOneStatus);
    },

    removeAll: function() {
      /*
      Tags.each(function(tag) {
        tag.clear();
      });
      */
      if(confirm('Usunąć wszystkie tagi?')) {
        while(!Tags.isEmpty()) {
          Tags.last().clear();
        }
      }
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
