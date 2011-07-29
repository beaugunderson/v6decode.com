// This is a re-implementation of the example given in diff_match_patch;
// I needed a way to specify a class name for the wrapped text.
diff_match_patch.prototype.diff_ourHtml = function(diffs) {
   var html = [];
   var i = 0;

   var pattern_amp = /&/g;
   var pattern_lt = /</g;
   var pattern_gt = />/g;
   var pattern_para = /\n/g;

   for (var x = 0; x < diffs.length; x++) {
      var op = diffs[x][0];    // Operation (insert, delete, equal)
      var data = diffs[x][1];  // Text of change.

      var text = data.replace(pattern_amp, '&amp;').replace(pattern_lt, '&lt;')
         .replace(pattern_gt, '&gt;').replace(pattern_para, '&para;<br>');

      switch (op) {
         case DIFF_INSERT:
            html[x] = '<ins class="diff">' + text + '</ins>';
            break;
         case DIFF_DELETE:
            html[x] = '<del class="diff">' + text + '</del>';
            break;
         case DIFF_EQUAL:
            html[x] = '<span class="diff">' + text + '</span>';
            break;
      }

      if (op !== DIFF_DELETE) {
         i += data.length;
      }
   }

   return html.join('');
};

// A convenience function to diff two addresses (or other text)
function diff(a, b) {
   var dmp = new diff_match_patch();

   var d = dmp.diff_main(a, b);

   return dmp.diff_ourHtml(d);
}

function format_netblock(netblock) {
   var start = netblock.startAddress.$.toLowerCase();
   var end = netblock.endAddress.$.toLowerCase();

   start = sprintf('<a href="#address=%s">%s</a>', start, start);
   end = sprintf('<a href="#address=%s">%s</a>', end, end);

   $('#arin .netblocks').append(sprintf('<dl>' +
      '<dt>CIDR length</dt> <dd>%s</dd>' +
      '<dt>Description</dt> <dd>%s</dd>' +
      '<dt>Start address</dt> <dd>%s</dd>' +
      '<dt>End address</dt> <dd>%s</dd>' +
      '<dt>Type</dt> <dd>%s</dd>' +
      '</dl>',
      netblock.cidrLength.$,
      netblock.description.$,
      start,
      end,
      netblock.type.$));
}

function format_arin(data) {
   $('#arin dt, #arin dd').hide();
   $('#arin dd').text('');

   if (data.name) {
      $('#arin .name').text(data.name.$).show().prev().show();
   }

   if (data.handle) {
      if (data.ref) {
         $('#arin .handle').html(sprintf('<a href="%s">%s</a>', data.ref.$, data.handle.$)).show().prev().show();
      } else {
         $('#arin .handle').text(data.handle.$).show().prev().show();
      }
   }

   if (data.parentNetRef) {
      $('#arin .parent').html(sprintf('<a href="%s">%s</a>', data.parentNetRef.$, data.parentNetRef['@handle'])).show().prev().show();
   }

   if (data.orgRef) {
      $('#arin .organization').html(sprintf('<a href="%s">%s - %s</a>', data.orgRef.$, data.orgRef['@handle'], data.orgRef['@name'])).show().prev().show();
   }

   if (data.registrationDate) {
      $('#arin .registration-date').text(data.registrationDate.$).show().prev().show();
   }

   if (data.updateDate) {
      $('#arin .update-date').text(data.updateDate.$).show().prev().show();
   }

   if (data.version) {
      $('#arin .version').text(data.version.$).show().prev().show();
   }

   if (data.startAddress) {
      var start = data.startAddress.$.toLowerCase();

      $('#arin .start-address').html(sprintf('<a href="#address=%s">%s</a>', start, start)).show().prev().show();
   }

   if (data.endAddress) {
      var end = data.endAddress.$.toLowerCase();

      $('#arin .end-address').html(sprintf('<a href="#address=%s">%s</a>', end, end)).show().prev().show();
   }

   if (data.netBlocks) {
      $.each(data.netBlocks, function(i, n) {
         format_netblock(n);
      });

      $('#arin .netblocks').show().prev().show();

      $('#arin .netblocks dt, #arin .netblocks dd').show();
   }

   if (data.comment) {
      comment = $.map(data.comment.line, function(c, i) {
         return c.$;
      });

      $('#arin .comment').html(sprintf('<pre>%s</pre>', comment.join('\n'))).show().prev().show();
   }
}

// Runs whenever the address changes
function update_address() {
   var original = $('#address').val();
   var address = new v6.Address(original);

   $.bbq.pushState({ address: original });

   original = original.replace(/%.*/, '');

   if (address.isValid()) {
      $('.error').hide();

      $('#address-wrapper').addClass('blue');
      $('#address-wrapper').removeClass('red');

      $('#valid').text('Yes');
      $('#correct').text(address.isCorrect() ? 'Yes' : 'No');
      $('#canonical').text(address.isCanonical() ? 'Yes' : 'No');

      $('#original').html(v6.Address.group(original));

      $('#subnet-string').text(address.subnet_string ? address.subnet_string : 'None');
      $('#percent-string').text(address.percent_string ? address.percent_string : 'None');

      var parsed1 = address.parsed_address.join(':');
      var parsed2 = diff(original, parsed1);

      var correct1 = address.correct_form();
      var correct2 = diff(original, correct1);

      var canonical1 = address.canonical_form();
      var canonical2 = diff(original, canonical1);

      $('#parsed').html(v6.Address.group(parsed1));
      $('#parsed-diff').html(parsed2);

      $('#correct-form').html(v6.Address.group(correct1));
      $('#correct-form-diff').html(correct2);

      $('#canonical-form').html(v6.Address.group(canonical1));
      $('#canonical-form-diff').html(canonical2);

      $('#ipv4-form').html(v6.Address.group(address.v4_form()));

      $('#decimal-groups').html(v6.Address.simpleGroup(address.decimal()));

      $('#base-16').text(address.bigInteger().toString(16));
      $('#base-10').text(address.bigInteger().toString());

      var zeropad = address.zeroPad();
      var zeropad_array = [zeropad.slice(0, 64), zeropad.slice(64, 128)];

      var base2_array = [];

      for (var i = 0; i < 8; i++) {
         base2_array.push(sprintf('<span class="hover-group group-%d">%s</span>',
               i, zeropad.slice(i * 16, (i * 16) + 16)
            .replace(/(0+)/g, '<span class="zero">$1</span>')));
      }

      $('#base-2').html(base2_array.slice(0, 4).join('') + '<br />' +
                        base2_array.slice(4, 8).join(''));

      update_teredo(address);
      update_arin_json(address);
   } else {
      $('#address-wrapper').addClass('red');
      $('#address-wrapper').removeClass('blue');

      $('.output').text('');

      $('#original').text(original);

      if (address.parse_error) {
         $('#parsed').html(address.parse_error);
      }

      $('.error').show();
      $('#error').text(address.error);

      $('#valid').text('No');
   }

   $('body').attr('class', '');

   add_hover_functions();

   update_diff();
}

function update_teredo(address) {
   if (address.isTeredo()) {
      var teredoData = address.teredo();

      $('#teredo .prefix').text(teredoData.prefix);
      $('#teredo .server-v4').text(teredoData.server_v4);
      $('#teredo .client-v4').text(teredoData.client_v4);
      $('#teredo .udp-port').text(teredoData.udp_port);
      $('#teredo .flags').text(teredoData.flags);

      $('#not-teredo').hide();
      $('#teredo').show();
   } else {
      $('#teredo').hide();
      $('#not-teredo').show();
   }
}

function update_arin_json(address) {
   $.getJSON('/arin/ip/' + address.correct_form(), function getArinJson(data) {
      format_arin(data.net);

      $('#arin-error').hide();
      $('#arin').show();
   }).error(function getArinJsonError(result) {
      if (result.status == 404) {
         $('#arin-error').text('No ARIN record found for that address.');

         $('#arin').hide();
         $('#arin-error').show();
      }
   });
}

function add_hover_functions() {
   $('.hover-group').hover(function hoverIn(e) {
      var classes = $(this).attr('class').split(' ');

      classes = $.map(classes, function(c, i) {
         if (c != 'group-v4') {
            return '.' + c;
         }
      });

      $('.hover-group').removeClass('active');

      if (classes.length > 1) {
         $(classes.join('')).addClass('active');
      }
   }, function hoverOut(e) {
      $('.hover-group').removeClass('active');
   });
}

function update_diff() {
   if ($('#show-diff').is(':checked')) {
      $('body').addClass('diff-visible');
      $('body').removeClass('hover-visible');

      $('ins.diff').addClass('visible');
      $('del.diff').show();
   } else {
      $('body').removeClass('diff-visible');

      $('ins.diff').removeClass('visible');
      $('del.diff').hide();
   }
}

function update_from_hash() {
   var a = $.bbq.getState('address');

   if (a != $('#address').val()) {
      $('#address').val(a);

      update_address();
   }
}

$(function() {
   $(window).bind('hashchange', function(e) {
      update_from_hash();
   });

   update_from_hash();
   update_diff();

   // Setup the event handler for the 'Show diff' checkboxe
   $('#show-diff').click(function() {
      update_diff();
   });

   // Make the input textbox update on change and keyup
   $('#address').bind('change keyup', function() {
      update_address();
   });
});
