function formatNetblock(netblock) {
   var start = netblock.startAddress.$.toLowerCase();
   var end = netblock.endAddress.$.toLowerCase();

   start = sprintf('<a href="#address=%1$s">%1$s</a>', start);
   end = sprintf('<a href="#address=%1$s">%1$s</a>', end);

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

function updateAddressFromRemoteAddress(options) {
   $.get('/ip.py').success(function(d, statusText, xhr) {
      if (statusText == 'success') {
         var addressString = xhr.getResponseHeader('x-address');

         var address = new v6.Address(addressString);

         if (address.isValid()) {
            thankUser(address.correctForm());

            if (options.setAddress) {
               $.bbq.pushState({
                  'address': addressString
               });
            }
         }
      }
   });
}

function thankUser(addressString) {
   $('#thanks').show();

   $('#user-address').attr('href', sprintf('/#address=%s', addressString));
}

function formatArin(data) {
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
         formatNetblock(n);
      });

      $('#arin .netblocks').show().prev().show();

      $('#arin .netblocks dt, #arin .netblocks dd').show();
   }

   if (data.comment) {
      comment = $.map(data.comment.line, function(c, i) {
         return c.$;
      });

      $('#arin .comment').html(sprintf('<pre>%s</pre>',
         comment.join('\n'))).show().prev().show();
   }
}

var loaded = false;

// Runs whenever the address changes
function updateAddress() {
   var addressString = $.trim($.bbq.getState('address'));

   if (addressString == "" &&
      loaded == false) {
      updateAddressFromRemoteAddress({ setAddress: true });

      return;
   }

   updateAddressFromRemoteAddress({ setAddress: false });

   loaded = true;

   // Prevent moving the cursor when editing the address from the middle
   if ($('#address').val() != addressString) {
      $('#address').val(addressString);
   }

   var address;
   var addressStringMinusSuffix = addressString.replace(/[%\/].*/, '');

   if (/^[01]{128}$/.test(addressString)) {
      address = v6.Address.fromBigInteger(new BigInteger(addressString, 2));
      addressStringMinusSuffix = address.parsedAddress.join(':');
   } else {
      address = new v6.Address(addressString);
   }

   if (address.isValid()) {
      $('.error').hide();

      $('#address-wrapper').addClass('blue');
      $('#address-wrapper').removeClass('red');

      $('#valid').text('Yes');
      $('#correct').text(address.isCorrect() ? 'Yes' : 'No');
      $('#canonical').text(address.isCanonical() ? 'Yes' : 'No');

      $('#original').html(v6.Address.group(addressStringMinusSuffix));

      $('#subnet').text(address.subnet ? address.subnet : 'None');
      $('#zone').text(address.zone ? address.zone : 'None');

      $('#subnet').unbind();

      $('#subnet').hover(function() {
         var row;
         var $e;
         var i;

         for (row = 1; row <= 2; row++) {
            $e = $();

            for (i = 0; i < address.subnetMask; i++) {
               $e = $e.add(sprintf('#row-%d .position-%d', row, i));
            }

            $e.clone().prependTo('#row-' + row).wrapAll('<span class="active" />');

            $e.addClass('hidden');
         }

         var bits = address.getBitsPastSubnet();
         var offset = address.subnetMask + bits.indexOf('1');
         var lastOffset = address.subnetMask + bits.lastIndexOf('1');

         if (offset >= address.subnetMask) {
            for (row = 1; row <= 2; row++) {
               $e = $();

               for (i = offset; i <= lastOffset; i++) {
                  $e = $e.add(sprintf('#row-%d .position-%d', row, i));
               }

               $e.addClass('error');
            }
         }
      }, function() {
         $('#base-2 span.active').remove();

         $('.digit').removeClass('hidden');
         $('.digit').removeClass('error');
      });

      $('#type').text(address.getType());
      $('#scope').text(address.getScope());

      var parsed = address.parsedAddress.join(':');
      var correct = address.correctForm();
      var canonical = address.canonicalForm();

      $('#parsed').html(v6.Address.group(parsed));
      $('#correct-form').html(v6.Address.group(correct));
      $('#canonical-form').html(v6.Address.group(canonical));

      $('#ipv4-form').html(v6.Address.group(address.v4inv6()));

      $('#decimal-groups').html(v6.Address.simpleGroup(address.decimal()));

      $('#base-16').text(address.bigInteger().toString(16));
      $('#base-10').text(address.bigInteger().toString());

      $('#reverse-form').text(address.reverseForm());
      $('#link-form').html(sprintf('<a href="%1$s">%1$s</a>', address.href()));
      $('#microsoft-form').text(address.microsoftTranscription());

      $('#first-address').html(address.startAddress().link());
      $('#last-address').html(address.endAddress().link());

      updateBase2(address);
      updateSubnetSelect(address);
      updateTeredo(address);
      updateArinJson(address);
   } else {
      $('#address-wrapper').addClass('red');
      $('#address-wrapper').removeClass('blue');

      $('.output').text('');

      $('#original').text(addressStringMinusSuffix);

      if (address.parseError) {
         $('#parsed').html(address.parseError);
      }

      $('.error').show();
      $('#error').text(address.error);

      $('#valid').text('No');
   }

   $('body').attr('class', '');

   addHoverBindings();
}

function updateBase2(address) {
   var zeropad = address.binaryZeroPad();
   var baseTwoArray = [];
   var i;

   for (i = 0; i < 8; i++) {
      baseTwoArray.push(sprintf('<span class="hover-group group-%d">%s</span>',
         i, v6.Address.spanAll(zeropad.slice(i * 16, (i * 16) + 16), i * 16)));
   }

   $('#base-2').html(sprintf('<div id="row-1">%s</div>' +
      '<div id="row-2">%s</div>',
      baseTwoArray.slice(0, 4).join(''),
      baseTwoArray.slice(4, 8).join('')));

   $('#base-2 .hover-group').unbind('click');

   $('#base-2 .hover-group').click(function() {
      $('.binary-visualizer').remove();

      var group = parseInt($(this).attr('class').match(/group-(\d+)/)[1], 10);

      $('#base-2').append(visualizeBinary(address.getBits(group * 16, (group + 1) * 16)));
   });
}

function updateSubnetSelect(address) {
   var i;

   $('#subnet-select').html('');

   for (i = address.subnetMask; i <= 128; i++) {
      var special = '';

      if (i == 128) {
         special = ' (an address)';
      } else if (i == 64) {
         special = ' (a device)';
      }

      $('#subnet-select').append(sprintf('<option value="%1$d">%1$d%2$s</option>', i, special));
   }

   $('#subnet-select').unbind();

   $('#subnet-select').bind('keyup mouseup change', function() {
      $('#subnets').text(address.possibleAddresses(parseInt($('#subnet-select').val(), 10)));
   });

   $('#subnet-select').change();
}

function visualizeBinary(bigInteger, opt_size) {
   if (opt_size === undefined) {
      opt_size = 16;
   }

   var binary = v6.Address.zeroPad(bigInteger.toString(2), opt_size);
   var powers = [];
   var i;

   for (i = binary.length - 1; i >= 0; i--) {
      powers.push(Math.pow(2, i));
   }

   var result = '<ul class="binary-visualizer">';

   for (i = 0; i < binary.length; i++) {
      result += sprintf(
         '<li>' +
          '<span class="digit binary-%1$s">%1$s</span>' +
          '<span class="binary-%1$s">%2$s</span>' +
         '</li>', binary[i], addCommas(String(powers[i])));
   }

   result += sprintf('<li><span class="binary-total">%s</span></li>', addCommas(bigInteger.toString(10)));
   result += '</ul>';

   return result;
}

function updateTeredo(address) {
   if (address.isTeredo()) {
      var teredoData = address.teredo();

      $('#teredo .prefix').text(teredoData.prefix);
      $('#teredo .server-v4').text(teredoData.server4);
      $('#teredo .client-v4').text(teredoData.client4);
      $('#teredo .udp-port').text(teredoData.udpPort);
      $('#teredo .flags').html(sprintf('<span class="hover-group group-4">%s</span>',
         v6.Address.spanAllZeroes(teredoData.flags)));

      $('#teredo .cone-nat').text(teredoData.coneNat ? 'Yes' : 'No');

      $('#teredo .ms-reserved').text(teredoData.microsoft.reserved ? 'Yes' : 'No');
      $('#teredo .ms-universal-local').text(teredoData.microsoft.universalLocal ? 'Local' : 'Universal');
      $('#teredo .ms-group-individual').text(teredoData.microsoft.groupIndividual ? 'Individual' : 'Group');
      $('#teredo .ms-nonce').text(teredoData.microsoft.nonce);

      $('#not-teredo').hide();
      $('#teredo').show();
   } else {
      $('#teredo').hide();
      $('#not-teredo').show();
   }
}

function updateArinJson(address) {
   $.getJSON('/arin/ip/' + address.correctForm(), function getArinJson(data) {
      formatArin(data.net);

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

function addHoverBindings() {
   $('.hover-group').unbind('hover');

   $('.hover-group').hover(function hoverIn(e) {
      var classes = $.map($(this).attr('class').split(' '), function(c, i) {
         if (c != 'group-v4') {
            return '.' + c;
         }
      });

      var hoverClasses = $(this).data('hover');

      $('.hover-group, .digit').removeClass('active');

      if (hoverClasses !== undefined) {
         $(this).addClass('active');

         if (typeof hoverClasses === "string") {
            $(hoverClasses).addClass('active');
         } else {
            var i;

            for (i = 0; i < hoverClasses.length; i++) {
               $(hoverClasses[i]).wrapAll('<span class="active wrapped" />');
            }
         }
      } else {
         if (classes.length > 1) {
            $(classes.join('')).addClass('active');
         }
      }
   }, function hoverOut(e) {
      $('.hover-group, .digit').removeClass('active');
      $('.wrapped > *').unwrap();
   });
}

var pushState = _.debounce(function() {
   var address = $.trim($('#address').val());

   if ($.bbq.getState('address') != address) {
      $.bbq.pushState({ 'address': address });
   }
}, 200);

$(function() {
   $(window).bind('hashchange', function(e) {
      updateAddress();
   });

   $(window).trigger('hashchange');

   // Focus the address input field
   $('#address').focus();

   // Make the input textbox update on change and keyup
   $('#address').bind('change keyup', pushState);
});