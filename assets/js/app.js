/* eslint-disable */

$(function() {
  $("#mainForm").alpaca({
    "schemaSource": "/public/schema.json",
    "optionsSource": "/public/options.json",
    "postRender": function(form) {
      setupForm(form);
    }
  });

  // EVENT HANDLERS
  // Show form sections
  $("body").on("click", "legend", function(e) {
    e.preventDefault();

    var container = $(this).parent().parent();

    if (container.attr("data-open") === "true") {
      // Close
      container.attr("data-open", "false");

      $(this).parent().find(".form-group, .alpaca-array-toolbar, .alpaca-helper, .alpaca-array-actionbar, .pull-left, .pull-right, legend, .form-custom-button").hide();
      $(this).parent().find("legend").eq(0).show();
    } else if (container.attr("data-open") === "false" || !container.attr("data-open")) {
      // Open
      container.attr("data-open", "true");

      $(this).parent().find(".form-group, .alpaca-array-toolbar, .alpaca-helper, .alpaca-array-actionbar, .pull-left, .pull-right, legend").show();
      $(this).parent().find('.form-custom-button').css({"display":"inline-block"});
    }
  });

  // Enable checkbox toggle style
  $("body").on("click", "input:checkbox, input:radio", function(e) {
    // Allow radio buttons to be deselected
    if ($(this).attr('type') === 'radio') {
      if($(this).parent().parent().hasClass('active')) {
        $(this).prop('checked', false);
        $(this).parent().parent().removeClass('active');

        var path = $(this).parent().parent().attr('name');

        setTimeout(function() {
          var payload = $("#mainForm").alpaca("get").getValue();

          path = path.split('_');

          if (path[0]) {
            delete payload[path[0]];
          } else if (path[0] && path[1]) {
            delete payload[path[0]][path[1]];
          }

          $('#mainForm').alpaca("get").setValue(payload);

          saveLocalStorage();
          refreshContributeForm();
        }, 200);

        return;
      }
    }

    if ($(this).parent().parent().parent().hasClass("boolean-toggle")) {
      return;
    }

    $(this).parent().parent().parent().find(".radio").removeClass("active");
    $(this).parent().parent().toggleClass("active");

    setTimeout(function() {
      saveLocalStorage();
      refreshContributeForm();
    }, 200);
  });

  // Save form JSON to localStorage on keyup event
  $("body").on("keyup", "input, textarea", function(e) {
    saveLocalStorage();
    refreshContributeForm();
  });

  $("body").on("change", "select", function(e) {
    saveLocalStorage();
    refreshContributeForm();
  });

  // Start again button
  $("#buttonStartAgain").click(function(e) {
    e.preventDefault();

    resetLocalStorage();
  });

  // Boolean toggle
  $("body").on("click", ".boolean-toggle input:radio", function(e) {
    var targetCheckbox = $(this).parent().parent().parent()
                          .find("input:checkbox");
    var targetCheckboxOn = targetCheckbox.is(":checked");

    $(this).parent().parent().parent().children().removeClass("active");
    $(this).parent().parent().addClass("active");

    $(this).parent().parent().parent().find('input:radio').not(this)
      .prop("checked", false);

    if ($(this).val() === "true") {
      if (!targetCheckboxOn) {
        targetCheckbox.trigger("click");
      }
    } else {
      if (targetCheckboxOn) {
        targetCheckbox.trigger("click");
      }
    }

    setTimeout(function() {
      saveLocalStorage();
      refreshContributeForm();
    }, 200);
  });

  $("body").on("click", "#buttonShowAllRights", function(e) {
    e.preventDefault();

    $('[data-alpaca-field-path="/rights/access"], '
        + '[data-alpaca-field-path="/rights/rectification"], '
        + '[data-alpaca-field-path="/rights/erasure"], '
        + '[data-alpaca-field-path="/rights/restrictProcessing"], '
        + '[data-alpaca-field-path="/rights/dataPortability"], '
        + '[data-alpaca-field-path="/rights/object"], '
        + '[data-alpaca-field-path="/rights/automatedDecisionMaking"]').show();

    $(this).hide();
  });

  // FUNCTIONS
  function setupForm(form) {
    // Repopulate form with JSON from localStorage if exists
    var payload = localStorage.getItem("payload");

    if (payload) {
      payload = JSON.parse(payload);
      form.setValue(payload);
    }

    // Run setValue again after 200ms to fix array render error
    // More info: https://github.com/gitana/alpaca/issues/356
    setTimeout(function() {
      // Retry populated form fields
      form.setValue(payload);

      // Hide all fields
      $(".form-group, .alpaca-array-toolbar, .alpaca-helper, .alpaca-array-actionbar, .pull-right, .form-custom-button").hide();

      // Show first field
      showFirstField();

      // Make legend titles clickable links
      $("#mainForm legend").each(function(i, e) {
        // Ignore anything that isn't a top level legend
        if ($(e).parents().length !== 11) {
          return;
        }

        var text = $(e).html();

        var a = $("<a>");
        a.attr("href", "#");
        a.append(text);

        $(e).empty().append(a);
      });

      // Radio selectors in Alpaca can't be used with boolean types and enum to
      // create yes/no toggles, so this makes our own using a checkbox
      var addToggle = [];

      $(".checkbox").each(function(i, e) {
        // Ignore data missing toggles
        if ($(e).attr('name').includes('isMissing')) {
          $(e).addClass('mark-as-missing');
          $(e).find('label').append("Can't find this information");
          return;
        }

        // Find where label-less checkboxes are
        var labelText = $(e).find("label").text().trim();

        if (labelText === "") {
          addToggle.push(e);
        }
      });

      addToggle.forEach(function(e, i) {
        $(e).hide();

        $(e).parent().addClass("boolean-toggle");

        var buttonYes = $("<div>");
        var buttonNo = $("<div>");
        buttonYes.addClass("alpaca-control").addClass("radio");
        buttonNo.addClass("alpaca-control").addClass("radio");

        var labelYes = $("<label>");
        var labelNo = $("<label>");
        labelYes.text("Yes");
        labelNo.text("No");

        var inputYes = $("<input>");
        var inputNo = $("<input>");
        inputYes.attr("type", "radio");
        inputYes.attr("value", "true");
        inputNo.attr("type", "radio");
        inputNo.attr("value", "false");

        if ($(e).find("input").prop("checked")) {
          inputYes.prop("checked", true);
        } else {
          inputNo.prop("checked", true);
        }

        labelYes.prepend(inputYes);
        labelNo.prepend(inputNo);

        buttonYes.append(labelYes);
        buttonNo.append(labelNo);

        $(e).parent().append(buttonYes);
        $(e).parent().append(buttonNo);
      });

      // Refresh contribute form
      refreshContributeForm();

      $("#mainForm input:radio, #mainForm input:checkbox").each(function(i, e) {
        if ($(e).prop("checked")) {
          $(e).parent().parent().addClass("active");
        }
      });

      createTextboxArrayForms();

      // CUSTOM FORM ELEMENTS
      // Add link to show specific right contact details
      var showAllRightsLink = $("<a>");
      showAllRightsLink.addClass("form-custom-button");
      showAllRightsLink.attr("href", "#");
      showAllRightsLink.attr("id", "buttonShowAllRights");
      showAllRightsLink.text("Show fields for each right");

      $('[data-alpaca-field-name="rights_general"]').append(showAllRightsLink);
    }, 200);
  }

  function createTextboxArrayForms() {
    $(".alpaca-array-toolbar").each(function(i, e) {
      if ($(e).find("input").length !== 0) {
        return;
      }

      var input = $("<input>");
      input.attr("type", "text");
      input.attr("id", "array-input-box" + i);
      input.addClass("array-input-box");
      input.attr("placeholder", "Enter a value and press return...");

      // var a = $("<a>");
      // a.attr("href", "#");
      // a.text("Add");

      $(e).append(input);
    });
  }

  $("body").on("keyup", ".array-input-box", function(e) {
    // TODO: Fix lag when adding a new item to the array

    if (e.keyCode === 13 && $(this).val().length > 0) {
      var value = $(this).val();
      var cachedParent = $(this).parent().parent();
      var cachedId = $(this).attr("id");

      $(this).parent().find(".alpaca-array-toolbar-action").trigger("click");

      setTimeout(function() {
        cachedParent.find("input.alpaca-control").last().val(value);
        refreshContributeForm();
        saveLocalStorage();
        createTextboxArrayForms();

        $('#' + cachedId).focus();
      }, 200);
    }
  });

  $("body").on("mouseup", ".alpaca-array-actionbar-action", function(e) {
    // TODO: Fix lag when removing an item in the array

    e.preventDefault();

    setTimeout(function() {
      createTextboxArrayForms();
      saveLocalStorage();
      refreshContributeForm();
    }, 200);
  });

  // Pressing tab and focusing on section opens it
  $("body").on("keyup", "#mainForm", function(e) {
    if (e.which === 9 && $(document.activeElement).parent().hasClass("alpaca-container-label")) {
      $(document.activeElement).trigger("click");
    }
  });

  function showFirstField() {
    $('[data-alpaca-container-item-name="organisationInformation"]')
      .find(".form-group, .alpaca-array-toolbar, .alpaca-helper, .alpaca-array-actionbar, .pull-right, .form-custom-button")
      .show();

    $('[data-alpaca-container-item-name="organisationInformation"]')
      .attr("data-open", "true")
  }

  function saveLocalStorage() {
    // Get form contents
    var payload = $("#mainForm").alpaca("get").getValue();

    // Set "payload" localStorage var with form contents JSON
    localStorage.setItem("payload", JSON.stringify(payload));
  }

  function resetLocalStorage() {
    if (confirm("Are you sure?")) {
      localStorage.removeItem("payload");
      location.reload();
    }
  }

  function refreshContributeForm() {
    var selectedCountry = $('select[name="organisationInformation_registrationCountry"]').val();
    selectedCountry = selectedCountry.split('_')[0].toLowerCase();

    if (selectedCountry === 'us') {
      $('[data-alpaca-container-item-name="privacyShield"]').show();
    }

    // Use .number as an easy way of selecting each form group
    $(".number").each(function(i, e) {
      var inputs = $(this).parent().parent().parent().parent().find('input');
      var selects = $(this).parent().parent().parent().parent().find('select');
      var textareas = $(this).parent().parent().parent().parent().find('textarea');

      var filledCount = 0;

      $(selects).each(function(i, e) {
        if ($(e).val() !== '') {
          filledCount++;
        }
      });

      $(inputs).each(function(i, e) {
        // text, radio, checkbox
        var type = $(e).attr('type');

        if (type === 'text') {
          if ($(e).val() !== '') {
            filledCount++;
          }
        }

        if (type === 'radio' || type === 'checkbox') {
          if ($(e).prop('checked')) {
            filledCount++;
          }
        }
      });

      $(textareas).each(function(i, e) {
        if ($(e).val() !== '') {
          filledCount++;
        }
      });

      if (filledCount > 0) {
        $(this).parent().parent().parent().parent().addClass('completed');
      } else {
        $(this).parent().parent().parent().parent().removeClass('completed');
      }
    });

    if (
      $("input[name=organisationInformation_name]").val() === "" ||
      $("input[name=organisationInformation_number]").val() === "" || $("select[name=organisationInformation_registrationCountry]").val() === ""
    ) {
      $('.required-fields-not-ok').show();
      $('.required-fields-ok').hide();
    } else {
      $('.required-fields-ok').show();
      $('.required-fields-not-ok').hide();
    }

    // Get JSON from form
    var payload = $("#mainForm").alpaca("get").getValue();

    // Show JSON in text area fields
    $(".generated-json").val(JSON.stringify(payload, null, 2));

    // Populate mailto: link for email contributions
    $("#button-email").attr("href", "mailto:ian@projectsbyif.com?body=" + JSON.stringify(payload));

    // Populate fields
    var proposedFilename = $("select[name=organisationInformation_registrationCountry]").val() + $("input[name=organisationInformation_number]").val();
    var proposedSlug = $("select[name=organisationInformation_registrationCountry]").val() + "/" + $("input[name=organisationInformation_number]").val();

    $(".contribute-filename").text(proposedFilename);
  }
});
