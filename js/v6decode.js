/*global Hipku:true*/

import { Address4, Address6, v6 } from 'https://esm.sh/ip-address@10';

var loaded = false;

function addCommas(number) {
  var r = /(\d+)(\d{3})/;

  while (r.test(number)) {
    number = number.replace(r, '$1,$2');
  }

  return number;
}

function zeroPad(s, n) {
  while (s.length < n) {
    s = '0' + s;
  }

  return s;
}

function debounce(fn, ms) {
  var timer;

  return function () {
    var args = arguments;

    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(null, args);
    }, ms);
  };
}

function parseHash() {
  var params = {};

  location.hash.replace(/^#/, '').split('&').forEach(function (pair) {
    if (!pair) {
      return;
    }

    var eq = pair.indexOf('=');
    var k = decodeURIComponent(eq >= 0 ? pair.slice(0, eq) : pair);
    var v = eq >= 0 ? decodeURIComponent(pair.slice(eq + 1)) : '';

    params[k] = v;
  });

  return params;
}

function getHashState(key) {
  return parseHash()[key];
}

function pushHashState(patch) {
  var params = parseHash();

  Object.assign(params, patch);

  location.hash = Object.keys(params).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');
}

function $(selector, root) {
  return (root || document).querySelector(selector);
}

function $$(selector, root) {
  return Array.from((root || document).querySelectorAll(selector));
}

function show(el) {
  if (el) {
    el.style.display = 'block';
  }
}

function hide(el) {
  if (el) {
    el.style.display = 'none';
  }
}

function showAll(selector) {
  $$(selector).forEach(show);
}

function hideAll(selector) {
  $$(selector).forEach(hide);
}

function setText(selector, text) {
  $$(selector).forEach(function (el) { el.textContent = text; });
}

function setHtml(el, html) {
  if (el) {
    el.innerHTML = html;
  }
}

function showWithLabel(el, text) {
  if (!el) {
    return;
  }

  el.textContent = text;

  show(el);

  if (el.previousElementSibling) {
    show(el.previousElementSibling);
  }
}

function showWithLabelHtml(el, html) {
  if (!el) {
    return;
  }

  setHtml(el, html);

  show(el);

  if (el.previousElementSibling) {
    show(el.previousElementSibling);
  }
}

function formatNetblock(netblock, version) {
  var start = netblock.startAddress.$.toLowerCase();
  var end = netblock.endAddress.$.toLowerCase();

  var start6 = start;
  var end6 = end;

  if (version === '4') {
    start6 = '::ffff:' + start;
    end6 = '::ffff:' + end;
  }

  start = `<a href="#address=${start6}">${start}</a>`;
  end = `<a href="#address=${end6}">${end}</a>`;

  $('#arin .netblocks').insertAdjacentHTML('beforeend',
    `<dl>
      <dt>CIDR length</dt> <dd>${netblock.cidrLength.$}</dd>
      <dt>Description</dt> <dd>${netblock.description.$}</dd>
      <dt>Start address</dt> <dd>${start}</dd>
      <dt>End address</dt> <dd>${end}</dd>
      <dt>Type</dt> <dd>${netblock.type.$}</dd>
    </dl>`);
}

function thankUser(addressString) {
  show($('#thanks'));

  $('#user-address').setAttribute('href', `/#address=${addressString}`);
}

function formatArin(data) {
  hideAll('#arin dt, #arin dd');
  setText('#arin dd', '');

  if (data.name) {
    showWithLabel($('#arin .name'), data.name.$);
  }

  if (data.handle) {
    if (data.ref) {
      showWithLabelHtml($('#arin .handle'),
        `<a href="${data.ref.$}">${data.handle.$}</a>`);
    } else {
      showWithLabel($('#arin .handle'), data.handle.$);
    }
  }

  if (data.parentNetRef) {
    showWithLabelHtml($('#arin .parent'),
      `<a href="${data.parentNetRef.$}">${data.parentNetRef['@handle']}</a>`);
  }

  if (data.orgRef) {
    showWithLabelHtml($('#arin .organization'),
      `<a href="${data.orgRef.$}">${data.orgRef['@handle']} - ${data.orgRef['@name']}</a>`);
  }

  if (data.registrationDate) {
    showWithLabel($('#arin .registration-date'), data.registrationDate.$);
  }

  if (data.updateDate) {
    showWithLabel($('#arin .update-date'), data.updateDate.$);
  }

  if (data.version) {
    showWithLabel($('#arin .version'), data.version.$);
  }

  if (data.startAddress) {
    var start = data.startAddress.$.toLowerCase();
    var start6 = data.version.$ === '4' ? '::ffff:' + start : start;

    showWithLabelHtml($('#arin .start-address'),
      `<a href="#address=${start6}">${start}</a>`);
  }

  if (data.endAddress) {
    var end = data.endAddress.$.toLowerCase();
    var end6 = data.version.$ === '4' ? '::ffff:' + end : end;

    showWithLabelHtml($('#arin .end-address'),
      `<a href="#address=${end6}">${end}</a>`);
  }

  if (data.netBlocks && data.netBlocks.netBlock) {
    var blocks = Array.isArray(data.netBlocks.netBlock) ?
      data.netBlocks.netBlock : [data.netBlocks.netBlock];

    blocks.forEach(function (n) {
      formatNetblock(n, data.version.$);
    });

    var netblocksEl = $('#arin .netblocks');

    show(netblocksEl);

    if (netblocksEl.previousElementSibling) {
      show(netblocksEl.previousElementSibling);
    }

    $$('#arin .netblocks dt, #arin .netblocks dd').forEach(show);
  }

  if (data.comment && data.comment.line) {
    var lines = Array.isArray(data.comment.line) ? data.comment.line : [data.comment.line];
    var comment = lines.map(function (c) { return c.$; });

    showWithLabelHtml($('#arin .comment'), `<pre>${comment.join('\n')}</pre>`);
  }
}

function updateAddressFromRemoteAddress(options) {
  fetch('https://jsonip.com').then(function (r) {
    return r.json();
  }).then(function (data) {
    var addressString = data.ip;

    if (Address6.isValid(addressString)) {
      var address6 = new Address6(addressString);

      thankUser(address6.correctForm());

      if (options.setAddress) {
        pushHashState({address: address6.correctForm()});
      }
    } else if (Address4.isValid(addressString)) {
      if (options.setAddress) {
        pushHashState({address: Address6.fromAddress4(addressString).to4in6()});
      }
    }
  }).catch(function (err) {
    console.log('AJAX error', err);
  });
}

function visualizeBinary(value, optionalSize) {
  if (optionalSize === undefined) {
    optionalSize = 16;
  }

  var binary = zeroPad(value.toString(2), optionalSize);
  var powers = [];
  var i;

  for (i = binary.length - 1; i >= 0; i--) {
    powers.push(Math.pow(2, i));
  }

  var result = '<ul class="binary-visualizer">';

  for (i = 0; i < binary.length; i++) {
    var bit = binary[i];

    result += `<li>` +
      `<span class="digit binary-${bit}">${bit}</span>` +
      `<span class="binary-${bit}">${addCommas(String(powers[i]))}</span>` +
      `</li>`;
  }

  result += `<li><span class="binary-total">${addCommas(value.toString(10))}</span></li>`;
  result += '</ul>';

  return result;
}

function updateBase2(address) {
  var zeropad = address.binaryZeroPad();
  var baseTwoArray = [];
  var i;

  for (i = 0; i < 8; i++) {
    baseTwoArray.push(
      `<span class="hover-group group-${i}">${v6.helpers.spanAll(zeropad.slice(i * 16, (i * 16) + 16), i * 16)}</span>`);
  }

  setHtml($('#base-2'),
    `<div id="row-1">${baseTwoArray.slice(0, 4).join('')}</div>` +
    `<div id="row-2">${baseTwoArray.slice(4, 8).join('')}</div>`);

  $$('#base-2 .hover-group').forEach(function (el) {
    el.onclick = function () {
      $$('.binary-visualizer').forEach(function (v) { v.remove(); });

      var group = parseInt(el.className.match(/group-(\d+)/)[1], 10);

      $('#base-2').insertAdjacentHTML('beforeend',
        visualizeBinary(address.getBits(group * 16, (group + 1) * 16)));
    };
  });
}

function updateSubnetSelect(address) {
  var select = $('#subnet-select');

  select.textContent = '';

  for (var i = address.subnetMask; i <= 128; i++) {
    var special = '';

    if (i === 128) {
      special = ' (an address)';
    } else if (i === 64) {
      special = ' (a device)';
    }

    select.insertAdjacentHTML('beforeend',
      `<option value="${i}">${i}${special}</option>`);
  }

  var onChange = function () {
    $('#subnets').textContent = address.possibleSubnets(parseInt(select.value, 10));
  };

  select.onkeyup = onChange;
  select.onmouseup = onChange;
  select.onchange = onChange;

  onChange();
}

function updateTeredo(address) {
  if (address.isTeredo()) {
    var t = address.inspectTeredo();

    $('#teredo .prefix').textContent = t.prefix;
    $('#teredo .server-v4').textContent = t.server4;
    $('#teredo .client-v4').textContent = t.client4;
    $('#teredo .udp-port').textContent = t.udpPort;
    setHtml($('#teredo .flags'),
      `<span class="hover-group group-4">${v6.helpers.spanAllZeroes(t.flags)}</span>`);

    $('#teredo .cone-nat').textContent = t.coneNat ? 'Yes' : 'No';

    $('#teredo .ms-reserved').textContent = t.microsoft.reserved ? 'Yes' : 'No';
    $('#teredo .ms-universal-local').textContent = t.microsoft.universalLocal ? 'Local' : 'Universal';
    $('#teredo .ms-group-individual').textContent = t.microsoft.groupIndividual ? 'Individual' : 'Group';
    $('#teredo .ms-nonce').textContent = t.microsoft.nonce;

    hide($('#not-teredo'));
    show($('#teredo'));
  } else {
    hide($('#teredo'));
    show($('#not-teredo'));
  }
}

function updateArinJson(address) {
  var url = 'https://whois.arin.net/rest/ip/' + address.correctForm() + '.json';

  fetch(url, {headers: {Accept: 'application/json'}}).then(function (r) {
    if (!r.ok) {
      throw new Error('arin status ' + r.status);
    }

    return r.json();
  }).then(function (data) {
    formatArin(data.net);

    hide($('#arin-error'));
    show($('#arin'));
  }).catch(function () {
    $('#arin-error').textContent = 'No ARIN record found for that address.';

    hide($('#arin'));
    show($('#arin-error'));
  });
}

function wrapAll(selector, className) {
  var els = $$(selector);

  if (!els.length) {
    return;
  }

  var wrapper = document.createElement('span');

  wrapper.className = className;

  els[0].parentNode.insertBefore(wrapper, els[0]);

  els.forEach(function (el) { wrapper.appendChild(el); });
}

function unwrapAll(selector) {
  $$(selector).forEach(function (wrapper) {
    var parent = wrapper.parentNode;

    while (wrapper.firstChild) {
      parent.insertBefore(wrapper.firstChild, wrapper);
    }

    wrapper.remove();
  });
}

function addHoverBindings() {
  $$('.hover-group').forEach(function (el) {
    el.onmouseenter = function () {
      var classes = el.className.split(/\s+/)
        .filter(function (c) { return c && c !== 'group-v4'; })
        .map(function (c) { return '.' + c; });

      var hoverClasses = el.dataset.hover;

      $$('.hover-group, .digit').forEach(function (e) { e.classList.remove('active'); });

      if (hoverClasses !== undefined) {
        el.classList.add('active');

        var parsed;

        try {
          parsed = JSON.parse(hoverClasses);
        } catch (_) {
          parsed = hoverClasses;
        }

        if (typeof parsed === 'string') {
          $$(parsed).forEach(function (e) { e.classList.add('active'); });
        } else {
          for (var i = 0; i < parsed.length; i++) {
            wrapAll(parsed[i], 'active wrapped');
          }
        }
      } else if (classes.length > 1) {
        $$(classes.join('')).forEach(function (e) { e.classList.add('active'); });
      }
    };

    el.onmouseleave = function () {
      $$('.hover-group, .digit').forEach(function (e) { e.classList.remove('active'); });
      unwrapAll('.wrapped');
    };
  });
}

var pushState = debounce(function () {
  var address = $('#address').value.trim();

  if (getHashState('address') !== address) {
    pushHashState({address: address});
  }
}, 200);

function groupAddressString(str) {
  return new Address6(str).group();
}

// Runs whenever the address changes
function updateAddress() {
  var addressString = (getHashState('address') || '').trim();

  if (addressString === '' && loaded === false) {
    updateAddressFromRemoteAddress({setAddress: true});

    return;
  }

  updateAddressFromRemoteAddress({setAddress: false});

  loaded = true;

  // Prevent moving the cursor when editing the address from the middle
  if ($('#address').value !== addressString) {
    $('#address').value = addressString;
  }

  var address = null;
  var parseError = null;
  var addressStringMinusSuffix = addressString.replace(/[%\/].*/, '');

  try {
    if (/^[01]{128}$/.test(addressString)) {
      address = Address6.fromBigInt(BigInt('0b' + addressString));
      addressStringMinusSuffix = address.parsedAddress.join(':');
    } else {
      address = new Address6(addressString);
    }
  } catch (e) {
    parseError = e;
  }

  var wrapper = $('#address-wrapper');

  if (address) {
    hideAll('.error');

    wrapper.classList.add('blue');
    wrapper.classList.remove('red');

    $('#valid').textContent = 'Yes';
    $('#correct').textContent = address.isCorrect() ? 'Yes' : 'No';
    $('#canonical').textContent = address.isCanonical() ? 'Yes' : 'No';

    setHtml($('#original'), groupAddressString(addressStringMinusSuffix));

    $('#subnet').textContent = address.subnet ?
      `${address.subnet} (${128 - address.subnetMask} network bits)` : 'None';

    $('#zone').textContent = address.zone ? address.zone : 'None';

    var subnetEl = $('#subnet');

    subnetEl.onmouseenter = function () {
      var row, els, i;

      for (row = 1; row <= 2; row++) {
        els = [];

        for (i = 0; i < address.subnetMask; i++) {
          els = els.concat($$(`#row-${row} .position-${i}`));
        }

        var rowEl = $(`#row-${row}`);

        if (els.length && rowEl) {
          var activeWrapper = document.createElement('span');

          activeWrapper.className = 'active';

          els.forEach(function (el) { activeWrapper.appendChild(el.cloneNode(true)); });

          rowEl.insertBefore(activeWrapper, rowEl.firstChild);

          els.forEach(function (el) { el.classList.add('hidden'); });
        }
      }

      var bits = address.getBitsPastSubnet();
      var offset = address.subnetMask + bits.indexOf('1');
      var lastOffset = address.subnetMask + bits.lastIndexOf('1');

      if (offset >= address.subnetMask) {
        for (row = 1; row <= 2; row++) {
          for (i = offset; i <= lastOffset; i++) {
            $$(`#row-${row} .position-${i}`).forEach(function (el) {
              el.classList.add('error');
            });
          }
        }
      }
    };

    subnetEl.onmouseleave = function () {
      $$('#base-2 span.active').forEach(function (e) { e.remove(); });
      $$('.digit').forEach(function (e) {
        e.classList.remove('hidden');
        e.classList.remove('error');
      });
    };

    $('#type').textContent = address.getType();
    $('#scope').textContent = address.getScope();

    var parsed = address.parsedAddress.join(':');
    var correct = address.correctForm();
    var canonical = address.canonicalForm();

    setHtml($('#parsed'), groupAddressString(parsed));
    setHtml($('#correct-form'), groupAddressString(correct));
    setHtml($('#canonical-form'), groupAddressString(canonical));

    var v4 = address.to4in6();

    setHtml($('#ipv4-form'), groupAddressString(v4));
    setHtml($('#decimal-groups'), v6.helpers.simpleGroup(address.decimal()).join(':'));

    $('#base-16').textContent = address.bigInt().toString(16);
    $('#base-10').textContent = address.bigInt().toString();

    $('#reverse-form').textContent = address.reverseForm();
    setHtml($('#link-form'), `<a href="${address.href()}">${address.href()}</a>`);
    $('#microsoft-form').textContent = address.microsoftTranscription();
    setHtml($('#hipku'), Hipku.encode(address.correctForm()).replace(/\n/g, '<br>'));

    var sixToFour = address.is4() ? address.to6to4() : null;
    var sixToFourHeader = document.getElementById('6to4-form-header');
    var sixToFourValue = sixToFourHeader.nextElementSibling;

    if (sixToFour) {
      show(sixToFourHeader);
      show(sixToFourValue);
      sixToFourValue.textContent = sixToFour.correctForm() + '/16';
    } else {
      hide(sixToFourHeader);
      hide(sixToFourValue);
    }

    setHtml($('#first-address'), address.startAddress().link({v4: addressStringMinusSuffix === v4}));
    setHtml($('#last-address'), address.endAddress().link({v4: addressStringMinusSuffix === v4}));

    updateBase2(address);
    updateSubnetSelect(address);
    updateTeredo(address);
    updateArinJson(address);
  } else {
    wrapper.classList.add('red');
    wrapper.classList.remove('blue');

    setText('.output', '');

    $('#original').textContent = addressStringMinusSuffix;

    if (parseError && parseError.parseMessage) {
      setHtml($('#parsed'), parseError.parseMessage);
    }

    showAll('.error');
    $('#error').textContent = parseError ? parseError.message : '';

    $('#valid').textContent = 'No';
  }

  document.body.className = '';

  addHoverBindings();
}

window.addEventListener('hashchange', updateAddress);

updateAddress();

$('#address').focus();

var onInput = function () { pushState(); };

$('#address').addEventListener('change', onInput);
$('#address').addEventListener('keyup', onInput);
