import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import CustomFileManagerQuestion from './question.ts';

const baseParams = {
	title: 'Documents',
	fieldName: 'documents',
	question: 'Documents',
	url: 'documents-manage',
	viewData: { uploadQuestionUrl: 'documents' }
};

const buildJourney = (answer: unknown) => ({
	response: { answers: { documents: answer } },
	journeyTemplate: 'test-template',
	taskListUrl: '/task-list',
	journeyTitle: 'Journey',
	getBackLink: () => '/back'
});

describe('CustomFileManagerQuestion', () => {
	it('exposes the uploaded files and upload question url in the view model', () => {
		const answer = [{ id: '1', fileName: 'report.pdf' }];
		const expectedDataRows = [
			[
				{
					html: '<a class="govuk-link" href="/case/undefined/download-case-document/undefined">report.pdf</a>'
				},
				{
					text: ''
				},
				{
					html: `<a class="govuk-link" href="documents/remove/1">Remove<span class="govuk-visually-hidden"> report.pdf + '</span></a>`
				}
			]
		];

		const viewModel = new CustomFileManagerQuestion(baseParams).toViewModel({
			section: { name: 'Section' },
			journey: buildJourney(answer),
			params: {}
		});

		assert.deepEqual(viewModel.dataRows, expectedDataRows);
	});

	it('falls back to an empty list when no files are uploaded', () => {
		const viewModel = new CustomFileManagerQuestion(baseParams).toViewModel({
			section: { name: 'Section' },
			journey: buildJourney(undefined),
			params: {}
		});

		assert.deepEqual(viewModel.dataRows, []);
	});
});
