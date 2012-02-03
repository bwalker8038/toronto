// An example Backbone application contributed by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses a simple
// [LocalStorage adapter](backbone-localstorage.html)
// to persist Backbone models within your browser.

// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){

  // Message Model
  // ----------

  // Our basic **Message** model has `content`, `order` attributes.
  window.Message = Backbone.Model.extend({

    // Server communication settings
    url  : 'messages',
    type : 'message',
    sync : _.sync,
    idAttribute: '_id',

    // Default attributes for the message.
    defaults: {
      content: "empty message..."
    },

    // Ensure that each message created has `content`.
    initialize: function() {
      if (!this.get("content")) {
        this.set({"content": this.defaults.content});
      }
    },

    // Remove this Message from *localStorage* and delete its view.
    clear: function() {
      this.destroy();
      this.view.remove();
    }

  });

  // Message Collection
  // ---------------

  // The collection of messages is backed by *localStorage* instead of a remote
  // server.
  window.MessageList = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Message,

    // Server communication settings
    // Save all of the message items under the `"messages"` namespace.
    url  : 'messages',
    type : 'message',
    sync : _.sync,
    idAttribute: '_id',

    // We keep the Messages in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    // Messages are sorted by their original insertion order.
    comparator: function(message) {
      return message.get('order');
    }

  });

  // Create our global collection of **Messages**.
  window.Messages = new MessageList;

  // Message Item View
  // --------------

  // The DOM element for a message item...
  window.MessageView = Backbone.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      "click span.message-destroy"   : "clear",
      "keypress .message-input"      : "updateOnEnter"
    },

    // The MessageView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a **Message** and a **MessageView** in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      _.bindAll(this, 'render', 'close');
      this.model.bind('remove', this.remove);
      this.model.bind('change', this.render);
      this.model.view = this;
    },

    // Re-render the contents of the message item.
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.setContent();
      return this;
    },

    // To avoid XSS (not that it would be harmful in this particular app),
    // we use `jQuery.text` to set the contents of the message item.
    setContent: function() {
      var content = this.model.get('content');
      this.$('.message-content').text(content);
      this.input = this.$('.message-input');
      this.input.bind('blur', this.close);
      this.input.val(content);
    },

    // Close the `"editing"` mode, saving changes to the message.
    close: function() {
      this.model.save({content: this.input.val()});
      $(this.el).removeClass("editing");
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove this view from the DOM.
    remove: function() {
      if (this.view) {
          this.view.remove();
      }
      $(this.el).remove();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.clear();
    }

  });

  // The Application
  // ---------------

  // Our overall **AppView** is the top-level piece of UI.
  window.AppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#messageapp"),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "keypress #new-message":  "createOnEnter",
      "keyup #new-message":     "showTooltip"
    },

    // At initialization we bind to the relevant events on the `Messages`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting messages that might be saved in *localStorage*.
    initialize: function() {
      _.bindAll(this, 'addOne', 'addAll', 'render');

      this.input = this.$("#new-message");

      Messages.bind('add',     this.addOne);
      Messages.bind('reset',   this.addAll);
      Messages.bind('all',     this.render);

      Messages.bind('subscribe', function(data) {
          console.log('subscribed', data);
      });
      Messages.bind('unsubscribe', function(data) {
          console.log('subscribed', data);
      });

      Messages.subscribe();
      Messages.fetch();
    },

    // Add a single message item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(message) {
      var view = new MessageView({model: message});
      this.$("#message-list").append(view.render().el);
    },

    // Add all items in the **Messages** collection at once.
    addAll: function() {
      Messages.each(this.addOne);
    },

    // Generate the attributes for a new Message item.
    newAttributes: function() {
      return {
        content: this.input.val(),
        order:   Messages.nextOrder(),
      };
    },

    // If you hit return in the main input field, create new **Message** model,
    // persisting it to *localStorage*.
    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      Messages.create(this.newAttributes());
      this.input.val('');
    },

    // Lazily show the tooltip that tells you to press `enter` to save
    // a new message item, after one second.
    showTooltip: function(e) {
      var tooltip = this.$(".ui-tooltip-top");
      var val = this.input.val();
      tooltip.fadeOut();
      if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
      if (val == '' || val == this.input.attr('placeholder')) return;
      var show = function(){ tooltip.show().fadeIn(); };
      this.tooltipTimeout = _.delay(show, 1000);
    }

  });
  
  // Finally, we kick things off by creating the **App**.
  DNode()
    .use(dnodeBackbone({
      pubsub: true
    }))
    .connect(_.once(function() {
      window.App = new AppView;
    }));

});
