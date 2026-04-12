(function () {
  'use strict';

  const root = window.ParallaxNu = window.ParallaxNu || {};
  const api = root.Cinematics = root.Cinematics || {};

  api.debugLEDToText = function debugLEDToText(led) {
    const lines = [];

    lines.push(`LED ${led.id || '(no id)'}`);
    lines.push(`Turn: ${led.turnNumber ?? '?'}`);
    lines.push(`Location: ${led.location?.key || '(unknown)'}`);
    lines.push(`Caption: ${led.location?.reference?.captionShort || '(none)'}`);
    lines.push(`Combats: ${led.combats?.length || 0}`);
    lines.push(`Entities: ${led.entities?.length || 0}`);
    lines.push('');

    lines.push('Location Context:');
    lines.push(`- Prev ships: ${(led.locationContextPreviousTurn?.shipIdsPresent || []).join(', ') || '(none)'}`);
    lines.push(`- Now ships: ${(led.locationContextNow?.shipIdsPresent || []).join(', ') || '(none)'}`);
    lines.push(`- Stayed: ${(led.locationContextDelta?.shipsStayed || []).join(', ') || '(none)'}`);
    lines.push(`- Departed: ${(led.locationContextDelta?.shipsDeparted || []).join(', ') || '(none)'}`);
    lines.push(`- Arrived: ${(led.locationContextDelta?.shipsArrived || []).join(', ') || '(none)'}`);
    lines.push(
      `- Starbase prev/now: ${led.locationContextDelta?.previousStarbasePresent ? 'yes' : 'no'} / ${led.locationContextDelta?.currentStarbasePresent ? 'yes' : 'no'}`
    );
    lines.push('');

    lines.push('Entities:');
    (led.entities || []).forEach((e) => {
      const own = e.truthOwnership || {};
      lines.push(
        `- ${e.id} | type=${e.type} | owner=${e.ownerId ?? '?'} | startOwner=${own.ownerIdAtStart ?? '?'} | endOwner=${own.ownerIdAtEnd ?? '?'} | ownerChanged=${own.ownerChangedDuringEvent ? 'yes' : 'no'} | race=${e.raceId ?? '?'} | tags=${(e.sourceTags || []).join(',') || '(none)'} | entry=${e.presentation?.entryMode || '(unset)'}`
      );
    });

    lines.push('');
    lines.push('Beats:');
    (led.beats || []).forEach((b) => {
      lines.push(`- ${b.id}: ${b.combatIds.join(', ')}`);
    });

    lines.push('');
    lines.push('Phases:');
    (led.phases || []).forEach((p) => {
      lines.push(`- ${p.orderIndex}: ${p.type}`);
    });

    return lines.join('\n');
  };
})();