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

    lines.push('Entities:');
    (led.entities || []).forEach((e) => {
      lines.push(
        `- ${e.id} | owner=${e.ownerId ?? '?'} | race=${e.raceId ?? '?'} | entry=${e.presentation?.entryMode || '(unset)'}`
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