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
  $.facebox('<p>'+error+'</p>');
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
    url: request_url,
    error: function(error, error_msg) {
      message = '';
      if(type == "fetch") {

        // Usuń tag, jeśli nie udało się pobrać statusów przy jego dodawaniu
        tag.clear();
        message = '<p>Wygląda na to, że taki tag nie istnieje lub nie mogliśmy połączyć się z Blipem.</p>';

      } else {
        message = '<p>Ups, nie możemy połączyć się z Blipem. Spróbuj&nbsp;ponownie za chwilę.</p>';
      }

      $.facebox(message);
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

        var photo_url = undefined;
        // Sprawdź, czy status zawiera zdjęcie,
        // jeśli tak - ustaw photo_url na miniaturę zdjęcia
        if (!_.isUndefined(status.pictures)) {
          photo_url = status.pictures[0].url.replace(/(\..{3}$)/, '_inmsg.jpg');
        }

        Statuses.create({
          body: status.body,
          blip_id: status.id,
          created_at: status.created_at,
          user: status.user_path.replace('/users/', ''),
          tag_name: tag.get("name"),
          photo: photo_url
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

// Global collection
window.Tags = new TagList;

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
    $(this.el).attr('id', this.model.get("name"));
    $(this.el).attr('data-id', this.model.get("id"));
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
