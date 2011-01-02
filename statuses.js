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

window.StatusList = Backbone.Collection.extend({
  model: Status,
  localStorage: new Store("statuses"),

  comparator: function(status) {
    return status.get("blip_id");
  }
});

window.Statuses = new StatusList;

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
    this.$('.content').text(this.model.escape("body"));
    this.$('.avatar').attr('src', 'http://blip.pl/users/'+this.model.get("user")+'/avatar/atto.jpg');
    this.$('.avatar').attr('alt', this.model.get("user"));
    this.$('.status-user a').text('^' + this.model.get("user"));
    this.$('.status-user a').attr('href', 'http://blip.pl/users/'+this.model.get("user")+'/dashboard');
    var status_id = this.model.get("blip_id");
    this.$('.status-link').html('<a href="http://blip.pl/s/'+status_id+'">[idź do statusu]</a>');

    // Dołącz zdjęcie, jeśli status je posiada
    photo = this.model.get("photo");
    if (!_.isUndefined(photo)) {
      this.$('.content').append(' <a rel="facebox" class="photo" href="'+photo+'">[zdjęcie]</a>');
      this.$('.photo').facebox();
    }
  },

  remove: function() {
    $(this.el).fadeOut();
  },

  highlight: function() {
    $(this.el).addClass('highlight');
  }
});
