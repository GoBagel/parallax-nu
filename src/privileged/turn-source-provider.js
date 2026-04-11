(function () {
  'use strict';

  const uw = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

  function firstFiniteNumber(...values) {
    for (const value of values) {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
    return null;
  }

  function deepCloneArray(value) {
    return Array.isArray(value) ? JSON.parse(JSON.stringify(value)) : [];
  }

  function waitForCinematicsApi(maxWaitMs = 15000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();

      (function poll() {
        const api = uw?.ParallaxNu?.Cinematics;
        if (api?.setTurnSourceProvider) {
          resolve(api);
          return;
        }

        if (Date.now() - start > maxWaitMs) {
          reject(new Error('Timed out waiting for ParallaxNu.Cinematics'));
          return;
        }

        setTimeout(poll, 100);
      })();
    });
  }

  function gmPost(url, formDataObj) {
    return new Promise((resolve, reject) => {
      const body = new URLSearchParams(formDataObj).toString();

      GM_xmlhttpRequest({
        method: 'POST',
        url,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        data: body,
        onload: (response) => {
          try {
            if (response.status < 200 || response.status >= 300) {
              reject(new Error(`HTTP ${response.status} from ${url}`));
              return;
            }

            const json = JSON.parse(response.responseText);
            resolve(json);
          } catch (err) {
            reject(err);
          }
        },
        onerror: (err) => {
          reject(new Error(`GM_xmlhttpRequest failed for ${url}: ${err?.error || 'unknown error'}`));
        },
        ontimeout: () => {
          reject(new Error(`GM_xmlhttpRequest timed out for ${url}`));
        },
      });
    });
  }

  async function registerTurnSourceProvider() {
    const api = await waitForCinematicsApi();

    api.setTurnSourceProvider(async (turnNumber, options = {}) => {
      const vgap = uw.vgap;
      const nu = uw.nu;

      const turn = firstFiniteNumber(turnNumber);
      const gameId = firstFiniteNumber(
        options.gameId,
        vgap?.gameId,
        vgap?.gameid,
        vgap?.game?.id,
        vgap?.settings?.id
      );
      const playerId = firstFiniteNumber(
        options.playerId,
        vgap?.loadPlayerId,
        vgap?.player?.id,
        vgap?.rst?.player?.id
      );
      const apiKey = String(
        options.apiKey ||
        vgap?.apikey ||
        nu?.apikey ||
        ''
      ).trim();

      if (turn == null || gameId == null || playerId == null || !apiKey) {
        throw new Error('Missing gameId, playerId, apiKey, or turnNumber for loadturn provider');
      }

      const json = await gmPost('https://api.planets.nu/game/loadturn', {
        gameid: String(gameId),
        apikey: apiKey,
        playerid: String(playerId),
        turn: String(turn),
      });

      const rst = json?.rst || null;
      if (!rst) {
        throw new Error('loadturn response did not include rst');
      }

      return {
        turnNumber: turn,
        planets: deepCloneArray(rst.planets),
        ships: deepCloneArray(rst.ships),
        starbases: deepCloneArray(rst.starbases),
        dataCompleteness: 'partial',
        source: 'gm-loadturn',
      };
    });

    console.log('[Parallax Nu] privileged turn source provider registered');
  }

  registerTurnSourceProvider().catch((err) => {
    console.error('[Parallax Nu] failed to register turn source provider', err);
  });
})();