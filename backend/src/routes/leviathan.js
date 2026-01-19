/**
 * NEXUS LEVIATHAN - API Routes
 * Complete API endpoints for the autonomous intelligence system
 */

const express = require('express');
const router = express.Router();

/**
 * Initialize Leviathan routes with service instances
 */
function createLeviathanRoutes(services, auth) {
  const {
    evolver,
    scheduler,
    eventBus,
    arbitrage,
    simulator,
    ledger,
    philosophy,
    stealthBrowser,
    proxyMesh,
    rateLimiter,
    affiliate,
    yieldHarvester,
    computeTiering
  } = services;

  // ═══════════════════════════════════════════════════════════════════════
  // EVOLVER ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════

  router.post('/evolver/evolve', auth, async (req, res) => {
    try {
      const { agentId, output, context } = req.body;
      const result = await evolver.evolve(req.user.id, agentId, output, context);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/evolver/quick', auth, async (req, res) => {
    try {
      const { agentId, output, context } = req.body;
      const result = await evolver.quickEvolve(req.user.id, agentId, output, context);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SCHEDULER ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════

  router.get('/scheduler/tasks', auth, async (req, res) => {
    try {
      const tasks = await scheduler.getUserTasks(req.user.id);
      res.json({ tasks });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/scheduler/tasks', auth, async (req, res) => {
    try {
      const result = await scheduler.createScheduledTask(req.user.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/scheduler/tasks/:id/pause', auth, async (req, res) => {
    try {
      const result = await scheduler.pauseTask(req.params.id, req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/scheduler/tasks/:id/resume', auth, async (req, res) => {
    try {
      const result = await scheduler.resumeTask(req.params.id, req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/scheduler/tasks/:id', auth, async (req, res) => {
    try {
      const result = await scheduler.deleteTask(req.params.id, req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/scheduler/status', auth, async (req, res) => {
    res.json(scheduler.getStatus());
  });

  // ═══════════════════════════════════════════════════════════════════════
  // EVENT BUS ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════

  router.get('/events/types', auth, (req, res) => {
    res.json({ events: eventBus.getEventTypes() });
  });

  router.get('/events/triggers', auth, async (req, res) => {
    try {
      const triggers = await eventBus.getUserTriggers(req.user.id);
      res.json({ triggers });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/events/triggers', auth, async (req, res) => {
    try {
      const result = await eventBus.createTrigger(req.user.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/events/triggers/:id', auth, async (req, res) => {
    try {
      const result = await eventBus.deleteTrigger(req.params.id, req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/events/recent', auth, async (req, res) => {
    try {
      const events = await eventBus.getRecentEvents(req.user.id, parseInt(req.query.limit) || 50);
      res.json({ events });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ATTENTION ARBITRAGE ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════

  router.post('/arbitrage/scan', auth, async (req, res) => {
    try {
      const { niche } = req.body;
      const gaps = await arbitrage.discoverGaps(req.user.id, niche);
      res.json({ gaps });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/arbitrage/gaps', auth, async (req, res) => {
    try {
      const { limit, platform } = req.query;
      const gaps = await arbitrage.getTopOpportunities(
        req.user.id,
        parseInt(limit) || 10,
        platform
      );
      res.json({ gaps });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/arbitrage/campaigns', auth, async (req, res) => {
    try {
      const { gapId } = req.body;
      const result = await arbitrage.createCampaign(req.user.id, gapId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/arbitrage/campaigns', auth, async (req, res) => {
    try {
      const campaigns = await arbitrage.getUserCampaigns(req.user.id, req.query.status);
      res.json({ campaigns });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/arbitrage/campaigns/:id/analyze', auth, async (req, res) => {
    try {
      const analysis = await arbitrage.analyzeCampaignPerformance(req.params.id, req.user.id);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SYNTHETIC SIMULATOR ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════

  router.post('/simulate', auth, async (req, res) => {
    try {
      const { content, platform, personaCount, contentType } = req.body;
      const result = await simulator.simulate(req.user.id, content, platform, {
        personaCount,
        contentType
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/simulate/quick', auth, async (req, res) => {
    try {
      const { content, platform } = req.body;
      const result = await simulator.quickSimulate(content, platform);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/simulate/:id/actual', auth, async (req, res) => {
    try {
      const result = await simulator.recordActualResults(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/simulate/history', auth, async (req, res) => {
    try {
      const history = await simulator.getSimulationHistory(req.user.id, parseInt(req.query.limit) || 20);
      res.json({ history });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/simulate/accuracy', auth, async (req, res) => {
    try {
      const stats = await simulator.getAccuracyStats(req.user.id);
      res.json({ stats });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // FEEDBACK LEDGER ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════

  router.post('/ledger/posts', auth, async (req, res) => {
    try {
      const { platform, externalId, content, contentType, metadata } = req.body;
      const result = await ledger.recordPost(req.user.id, platform, {
        externalId, content, contentType, metadata
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/ledger/posts/:id/metrics', auth, async (req, res) => {
    try {
      const result = await ledger.updateMetrics(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/ledger/posts/:id', auth, async (req, res) => {
    try {
      const result = await ledger.getPostFeedback(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/ledger/posts', auth, async (req, res) => {
    try {
      const posts = await ledger.getRecentPosts(req.user.id, parseInt(req.query.limit) || 20, req.query.platform);
      res.json({ posts });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/ledger/patterns', auth, async (req, res) => {
    try {
      const patterns = await ledger.analyzePatterns(req.user.id, parseInt(req.query.days) || 30);
      res.json(patterns);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/ledger/insights', auth, async (req, res) => {
    try {
      const insights = await ledger.getInsights(req.user.id, parseInt(req.query.days) || 30);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PHILOSOPHY ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════

  router.get('/philosophy/rules', auth, async (req, res) => {
    try {
      const rules = await philosophy.getCurrentPhilosophy(req.user.id);
      res.json({ rules });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/philosophy/evolve', auth, async (req, res) => {
    try {
      const result = await philosophy.evolve(req.user.id, 'manual');
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/philosophy/rules', auth, async (req, res) => {
    try {
      const result = await philosophy.createRule(req.user.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/philosophy/rules/:id', auth, async (req, res) => {
    try {
      const result = await philosophy.deleteRule(req.params.id, req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/philosophy/history', auth, async (req, res) => {
    try {
      const history = await philosophy.getEvolutionHistory(req.user.id, parseInt(req.query.limit) || 10);
      res.json({ history });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/philosophy/summary', auth, async (req, res) => {
    try {
      const summary = await philosophy.getPhilosophySummary(req.user.id);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // GHOST PROTOCOL ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════

  router.post('/ghost/browser/launch', auth, async (req, res) => {
    try {
      const result = await stealthBrowser.launchBrowser(req.body);
      if (result.success) {
        res.json({ success: true, browserId: result.browserId });
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/ghost/browser/:id/navigate', auth, async (req, res) => {
    try {
      const result = await stealthBrowser.navigate(req.params.id, req.body.url);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/ghost/browser/:id/type', auth, async (req, res) => {
    try {
      const { selector, text } = req.body;
      const result = await stealthBrowser.humanType(req.params.id, selector, text);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/ghost/browser/:id/click', auth, async (req, res) => {
    try {
      const result = await stealthBrowser.humanClick(req.params.id, req.body.selector);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/ghost/browser/:id/close', auth, async (req, res) => {
    try {
      const result = await stealthBrowser.closeBrowser(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/ghost/browsers', auth, (req, res) => {
    res.json({ browsers: stealthBrowser.getActiveBrowsers() });
  });

  router.get('/ghost/proxies', auth, async (req, res) => {
    try {
      const stats = await proxyMesh.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/ghost/rate-limits', auth, async (req, res) => {
    try {
      const status = await rateLimiter.getStatus(req.query.platform);
      res.json({ limits: status });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // AFFILIATE ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════

  router.get('/affiliate/stats', auth, async (req, res) => {
    try {
      const stats = await affiliate.getStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/affiliate/links', auth, async (req, res) => {
    try {
      const result = await affiliate.generateLink(req.user.id, req.body.destination);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/affiliate/links', auth, async (req, res) => {
    try {
      const links = await affiliate.getUserLinks(req.user.id);
      res.json({ links });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/affiliate/leaderboard', auth, async (req, res) => {
    try {
      const leaderboard = await affiliate.getLeaderboard(parseInt(req.query.limit) || 10);
      res.json({ leaderboard });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public referral redirect
  router.get('/r/:code', async (req, res) => {
    try {
      const result = await affiliate.trackClick(req.params.code, {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      if (result.success) {
        res.redirect(result.destination);
      } else {
        res.redirect('/');
      }
    } catch (error) {
      res.redirect('/');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // YIELD HARVESTER ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════

  router.post('/yield/scan', auth, async (req, res) => {
    try {
      const result = await yieldHarvester.detectOpportunities(req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/yield/opportunities', auth, async (req, res) => {
    try {
      const opportunities = await yieldHarvester.getOpportunities(req.user.id, req.query.status);
      res.json({ opportunities });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/yield/products', auth, async (req, res) => {
    try {
      const result = await yieldHarvester.createProduct(req.user.id, req.body.opportunityId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/yield/products', auth, async (req, res) => {
    try {
      const products = await yieldHarvester.getUserProducts(req.user.id, req.query.status);
      res.json({ products });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/yield/analytics', auth, async (req, res) => {
    try {
      const analytics = await yieldHarvester.getRevenueAnalytics(req.user.id, parseInt(req.query.days) || 30);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // COMPUTE TIERING ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════

  router.get('/compute/tiers', auth, (req, res) => {
    res.json({ tiers: computeTiering.getTiers() });
  });

  router.get('/compute/usage', auth, async (req, res) => {
    try {
      const analytics = await computeTiering.getUsageAnalytics(req.user.id, parseInt(req.query.days) || 30);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/compute/check', auth, async (req, res) => {
    try {
      const result = await computeTiering.canPerform(req.user.id, req.body.operation);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/compute/tier', auth, async (req, res) => {
    try {
      const tier = await computeTiering.getUserTier(req.user.id);
      res.json({ tier });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add seats to Agency account (per-seat billing)
  router.post('/compute/seats', auth, async (req, res) => {
    try {
      const { seats } = req.body;
      if (!seats || seats < 1) {
        return res.status(400).json({ error: 'Invalid seat count' });
      }

      // Get user's org
      const user = await computeTiering.pool.query(
        'SELECT org_id FROM users WHERE id = $1',
        [req.user.id]
      );

      if (!user.rows[0]?.org_id) {
        return res.status(400).json({ error: 'No organization found. Agency tier required.' });
      }

      const result = await computeTiering.addSeats(user.rows[0].org_id, seats, req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get seat info for Agency account
  router.get('/compute/seats', auth, async (req, res) => {
    try {
      const user = await computeTiering.pool.query(
        'SELECT org_id FROM users WHERE id = $1',
        [req.user.id]
      );

      if (!user.rows[0]?.org_id) {
        return res.json({ seatInfo: null, message: 'No organization found' });
      }

      const seatInfo = await computeTiering.getOrgSeatInfo(user.rows[0].org_id);
      res.json({ seatInfo });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createLeviathanRoutes;
