import os
import tempfile
import pytest
from app import create_app


@pytest.fixture
def client():
    app = create_app('development')
    app.config['TESTING'] = True
    with app.test_client() as c:
        yield c


def test_index(client):
    resp = client.get('/')
    assert resp.status_code == 200


def test_merge_page(client):
    resp = client.get('/merge')
    assert resp.status_code == 200


def test_upload_no_file(client):
    resp = client.post('/api/upload')
    assert resp.status_code == 400


def test_merge_requires_two_files(client):
    resp = client.post('/api/merge',
        json={'file_ids': ['only-one'], 'output_name': 'test'},
        content_type='application/json')
    assert resp.status_code == 400
