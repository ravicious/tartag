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

  send_request: function(type, callback) {
    var tag = this;

    if(type == "refresh") {
      var latest_status_id = _.last(tag.statuses()).get("blip_id");
      var request_url = 'http://api.blip.pl/tags/'+this.get("name")+'/since/'+latest_status_id+'?include=pictures&callback=?'
      // wyświetl loadera
      tag.view.toggleLoader();
    } else {
      var request_url = 'http://api.blip.pl/tags/'+this.get("name")+'.json?include=pictures&callback=?'
    }


    $.jsonp({
      url: 'http://api.blip.pl/tags/'+this.get("name")+'/since/'+latest_status_id+'?include=pictures&callback=?',
      error: function(error, error_msg) {
        alert('Błąd połączenia z Blipem. Być może taki tag nie istnieje?');
      },
      // json może być pusty - nie ma wtedy żadnych nowych wiadomości
      complete: function() {
        if(type == "refresh"){
          // schowaj loadera
          tag.view.toggleLoader();
        }
      },
      success: function(json, text_status) {

        _.each(json.reverse(), function(status){
          Statuses.create({
            body: status.body,
            blip_id: status.id,
            created_at: status.created_at,
            user: status.user_path.replace('/users/', ''),
            tag_name: tag.get("name")
          });
        });

        if(typeof callback === 'function')
        {
          setTimeout(callback, 100);
        }

      }
    });

  },

  fetch_statuses: function() {
    this.send_request("fetch");
  },

  refresh: function(callback) {
    this.send_request("refresh", callback);
  }

  });

  window.Status = Backbone.Model.extend({
    initialize: function() {
      _.bindAll(this, "error");
      this.bind("error", this.handle_error);
    },

    handle_error: function() {
      this.destroy();
    },

    clear: function() {
      this.destroy();
      this.view.remove();
    },

    validate: function(attrs) {
      if(_.include(Statuses.pluck("blip_id"), attrs.blip_id)) {
        return "Podany status już istnieje."
      }
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

    comparator: function(status) {
      return status.get("blip_id");
    }
  });

  // Global collection
  window.Tags = new TagList;
  window.Statuses = new StatusList;

  // Tag item view
  window.TagView = Backbone.View.extend({
    tagName: "div",
    className: "tag",

    template: _.template($('#tag-template').html()),

    events: {
      "click span.tag-destroy": "clear",
      "click span.tag-refresh": "refreshTag"
    },

    initialize: function() {
      _.bindAll(this, 'render');
      this.model.view = this;
      this.listName = this.model.get("name")+'-statuses';
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
      this.$('.statuses-list').attr('id', this.listName);
    },

    remove: function() {
      var element = this.el;
      $(element).fadeOut(function() {
        // usuwa cały element z dokumentu (w tym wyświetlaną listę statusów)
        $(element).remove();
      });
    },

    clear: function() {
      this.model.clear();
    },

    toggleLoader: function() {
      this.$('.loader').fadeToggle();
    },

    refreshTag: function() {
      var tagView = this;
      // usuń podświetlenie ze wszystkich statusów należących do tagu
      $('#'+this.listName+' li').removeClass('highlight');

      var statuses_before_refresh = this.model.statuses();

      this.model.refresh(function() {
        var new_statuses = array_diff(tagView.model.statuses(), statuses_before_refresh);

        // podświetl wszystkie nowe statusy
        _.each(new_statuses, function(status) {
          status.view.highlight();
        });
      });
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
      $(this.el).fadeIn();
      this.setContent();
      return this;
    },

    setContent: function() {
      this.$('.content').text(this.model.get("body"));
      this.$('.avatar').attr('src', 'http://blip.pl/users/'+this.model.get("user")+'/avatar/atto.jpg');
      this.$('.avatar').attr('alt', this.model.get("user"));
      this.$('.status-user a').text('^' + this.model.get("user"));
      this.$('.status-user a').attr('href', 'http://blip.pl/users/'+this.model.get("user")+'/dashboard');
      var status_id = this.model.get("blip_id");
      this.$('.status-link').html('<a href="http://blip.pl/s/'+status_id+'">[idź do statusu]</a>');
    },

    remove: function() {
      $(this.el).fadeOut();
    },

    highlight: function() {
      $(this.el).addClass('highlight');
    }
  });

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
