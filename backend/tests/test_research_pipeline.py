import asyncio

from backend.research.pipeline import ResearchPipeline


class TestFingerprint:
    def test_same_input_same_hash(self):
        p = ResearchPipeline()
        fp1 = p._fingerprint("Test Title", "source.com")
        fp2 = p._fingerprint("Test Title", "source.com")
        assert fp1 == fp2

    def test_different_input_different_hash(self):
        p = ResearchPipeline()
        fp1 = p._fingerprint("Test Title", "source.com")
        fp3 = p._fingerprint("Different Title", "source.com")
        assert fp1 != fp3


class TestResearchPipelineInit:
    def test_has_run_research_cycle(self):
        p = ResearchPipeline()
        assert hasattr(p, "run_research_cycle")

    def test_run_research_cycle_is_async(self):
        p = ResearchPipeline()
        assert asyncio.iscoroutinefunction(p.run_research_cycle)
