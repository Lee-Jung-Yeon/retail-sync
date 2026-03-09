import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
import { CustomersService } from './customers.service';

@Controller('customers')
// @UseGuards(AuthGuard('jwt'))
export class CustomersController {
    constructor(private customersService: CustomersService) { }

    @Get('lookup')
    lookup(@Query('phone_last4') phone: string, @Query('gender') gender?: string, @Query('age_group') age?: string) {
        return this.customersService.lookup(phone, gender, age);
    }

    @Get(':id/profile-card')
    getProfileCard(@Param('id') id: string) {
        return this.customersService.getProfileCard(id);
    }

    @Get(':id/preferences')
    getPreferences(@Param('id') id: string) {
        return this.customersService.getPreferences(id);
    }

    @Patch(':id/preferences')
    updatePreferences(
        @Param('id') id: string,
        @Body() body: { session_id: string; preferences: { pref_category: string; pref_value: string; source?: string }[] },
    ) {
        return this.customersService.upsertPreferences(id, body.session_id, body.preferences);
    }

    @Post(':id/membership')
    joinMembership(@Param('id') id: string) {
        return this.customersService.joinMembership(id);
    }
}
