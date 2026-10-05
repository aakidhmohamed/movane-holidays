'use strict';
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const menuButton = $('.menu-toggle');
const mobileMenu = $('#mobile-menu');
function closeMenu() { mobileMenu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open menu'); }
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); mobileMenu.hidden = !open; });
$$('a, button', mobileMenu).forEach(item => item.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
const details = {
  coast: { title: 'The southern coast', eyebrow: 'BAREFOOT DAYS & OCEAN BREEZES', image: 'coast', interest: 'Coast', description: 'Follow the shoreline from Galle’s old streets to Weligama’s surf and Mirissa’s palm-fringed bays. Leave a little space in the day for a swim, a fresh coconut and absolutely nothing at all.', highlights: ['Walk the lanes and ramparts of Galle Fort.', 'Try a beginner surf lesson in Weligama.', 'Watch the ocean from Coconut Tree Hill in Mirissa.'] },
  hills: { title: 'Ella & the highlands', eyebrow: 'TEA TRAILS & SLOW TRAIN RIDES', image: 'ella', interest: 'Hills', description: 'Head inland to winding railways, green tea slopes and cool mountain air. The highlands reward an unhurried pace, whether you’re taking in a valley view or lingering over a cup of Ceylon tea.', highlights: ['See the Nine Arch Bridge in Ella.', 'Walk Little Adam’s Peak for hill-country views.', 'Explore tea country around Nuwara Eliya.'] },
  culture: { title: 'The cultural heart', eyebrow: 'ANCIENT PLACES & LIVING STORIES', image: 'sigiriya', interest: 'Culture', description: 'Discover the island’s cultural heart among rock fortresses, cave temples and ancient cities. Start early, take your time and let the stories of these remarkable places unfold.', highlights: ['Climb Sigiriya’s rock fortress.', 'Visit the painted caves of Dambulla.', 'Explore the ancient city of Polonnaruwa.'] },
  island: { title: 'The island, unhurried', eyebrow: '12 DAYS · A LITTLE OF EVERYTHING', image: 'sigiriya', interest: 'all', duration: '12', description: 'A suggested route that brings together Sri Lanka’s cultural heart, hill-country scenery and southern shore. Adjust the pace and stops to suit you.', highlights: ['Days 1–3: arrive and explore Sigiriya and Dambulla.', 'Days 4–7: Kandy, tea country and Ella.', 'Days 8–12: Galle, the southern coast and departure.'] },
  coastal: { title: 'Along the southern shore', eyebrow: '7 DAYS · SUN, SEA & SLOW MORNINGS', image: 'coast', interest: 'Coast', duration: '7', description: 'A suggested week along Sri Lanka’s southern coast, with time for historic streets, surf lessons, beach walks and slow mornings.', highlights: ['Days 1–2: Galle Fort and the nearby coast.', 'Days 3–4: Weligama and Mirissa.', 'Days 5–7: Tangalle, a little relaxation and departure.'] },
  highlands: { title: 'Into the green', eyebrow: '8 DAYS · WALK A LITTLE. WONDER A LOT.', image: 'ella', interest: 'Hills', duration: '8', description: 'An eight-day route inspiration through Sri Lanka’s hill country. Make room for rail journeys, tea landscapes and walks around Ella; train tickets and stays can be arranged with your travel team.', highlights: ['Days 1–2: arrive and explore Kandy.', 'Days 3–4: Nuwara Eliya and tea country.', 'Days 5–8: Ella, hill walks and departure.'] }
};
const detailDialog = $('#detail-dialog');
const planDialog = $('#plan-dialog');
let selectedDetail;
function openDetails(key) {
  selectedDetail = details[key];
  $('#detail-eyebrow').textContent = selectedDetail.eyebrow;
  $('#detail-title').textContent = selectedDetail.title;
  $('#detail-description').textContent = selectedDetail.description;
  $('#detail-image').src = `assets/${selectedDetail.image}.jpg`;
  $('#detail-image').alt = selectedDetail.title;
  $('#detail-highlights').replaceChildren(...selectedDetail.highlights.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
  detailDialog.showModal();
}
$$('[data-detail]').forEach(button => button.addEventListener('click', () => openDetails(button.dataset.detail)));
$$('[data-route]').forEach(button => button.addEventListener('click', () => openDetails(button.dataset.route)));
function openPlanner(preference, duration) {
  closeMenu();
  $('#plan-result').hidden = true;
  $('#plan-form').hidden = false;
  $('#plan-status').textContent = '';
  if (preference) $$('input[name="interest"]').forEach(input => { input.checked = preference === 'all' || preference === input.value; });
  if (duration) $('#plan-form select[name="duration"]').value = duration;
  planDialog.showModal();
}
$$('[data-plan]').forEach(button => button.addEventListener('click', () => openPlanner()));
$('#detail-plan').addEventListener('click', () => { detailDialog.close(); openPlanner(selectedDetail.interest, selectedDetail.duration); });
$$('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => { const box = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close(); }));
const stopOptions = {
  Culture: [['Sigiriya & Dambulla', 'Rock fortress, cave temples and time to explore'], ['Kandy', 'A lakeside city and a gateway to the hills']],
  Hills: [['Kandy', 'A lakeside city and a gateway to the hills'], ['Nuwara Eliya', 'Tea landscapes and cool mountain air'], ['Ella', 'Scenic train journeys, the Nine Arch Bridge and hill walks']],
  Coast: [['Galle', 'Historic streets, ramparts and the sea'], ['Mirissa & Weligama', 'Beach days, easy surf and slow mornings']]
};
let travelBrief = '';
$('#plan-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const interests = data.getAll('interest');
  if (!interests.length) { const input = $('input[name="interest"]'); input.setCustomValidity('Choose at least one interest to create your route.'); input.reportValidity(); input.addEventListener('change', () => input.setCustomValidity(''), { once: true }); return; }
  const duration = Number(data.get('duration'));
  let stops = ['Culture', 'Hills', 'Coast'].filter(interest => interests.includes(interest)).flatMap(interest => stopOptions[interest]);
  stops = stops.filter((stop, index, list) => list.findIndex(other => other[0] === stop[0]) === index);
  if (duration === 7 && stops.length > 4) stops = stops.filter((_, index) => index !== 2 && index !== 4);
  const daysPerStop = Math.floor(duration / stops.length);
  let extraDays = duration % stops.length;
  let startDay = 1;
  const route = stops.map(([place, description]) => { const nights = daysPerStop + (extraDays-- > 0 ? 1 : 0); const endDay = startDay + nights - 1; const label = `Day${nights > 1 ? 's' : ''} ${startDay}${nights > 1 ? `–${endDay}` : ''}: ${place}`; startDay = endDay + 1; return { label, description }; });
  $('#result-title').textContent = `${duration} days, your kind of island`;
  $('#result-route').replaceChildren(...route.map(stop => { const item = document.createElement('li'); const title = document.createElement('strong'); title.textContent = stop.label; const description = document.createElement('div'); description.textContent = stop.description; item.append(title, description); return item; }));
  travelBrief = `MOVANE HOLIDAYS\nYour Sri Lanka travel brief\n\nDuration: ${duration} days\nTravellers: ${data.get('travellers')}\nInterests: ${interests.join(', ')}\n\nSuggested route\n${route.map(stop => `${stop.label}\n${stop.description}`).join('\n\n')}\n\nPersonal notes: ${String(data.get('notes')).trim() || 'None yet'}\n\nThis is a route inspiration brief. Dates, stays, transfers, tickets and bookings need to be arranged with your travel team. No reservation has been made.\n`;
  form.hidden = true;
  $('#plan-result').hidden = false;
  $('#result-title').setAttribute('tabindex', '-1');
  $('#result-title').focus();
});
$$('input[name="interest"]').forEach(input => input.addEventListener('change', () => $('input[name="interest"]').setCustomValidity('')));
$('#edit-plan').addEventListener('click', () => { $('#plan-result').hidden = true; $('#plan-form').hidden = false; $('input[name="interest"]').focus(); });
$('#download-brief').addEventListener('click', () => { const url = URL.createObjectURL(new Blob([travelBrief], { type: 'text/plain;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'movane-sri-lanka-travel-brief.txt'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); $('#plan-status').textContent = 'Your travel brief is ready to save.'; });
$('#year').textContent = new Date().getFullYear();
