import sys
import os

# Add the package to sys.path
sys.path.insert(0, os.path.abspath('.'))

from company_reader.segmentation_models import EntitySegmentationResult, SegmentationStatus

try:
    seg = EntitySegmentationResult(
        source_url="http://example.com", 
        text_sha256="", 
        status=SegmentationStatus.SKIPPED_CANDIDATE_ERROR
    )
    print("SUCCESS: len(entities) =", len(seg.entities))
except Exception as e:
    print("ERROR:", repr(e))
